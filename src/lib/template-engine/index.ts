import { detectLayoutMetadata, type LayoutMetadata } from "@/lib/layout-detector";
import { mapLayoutToTemplate, type TemplateVariant } from "@/lib/layout-mapper";
import { resolveStyleConfig } from "@/lib/style-config";

type TemplateChoice = "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";

type BuildArgs = {
  title: string;
  originalResumeText: string;
  optimizedResumeText: string;
  templateChoice: TemplateChoice;
  matchScore?: number;
  keywords?: string[];
};

type ResumeSection = {
  heading: string;
  lines: string[];
};

type ContactInfo = {
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
};

type BuildResult = {
  html: string;
  metadata: LayoutMetadata;
  variant: TemplateVariant;
};

const SIDEBAR_HEADINGS = new Set(["Skills", "Languages", "Certifications", "Interests"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripMarkdown(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();
}

function normalizeHeading(heading: string) {
  const clean = heading.replace(/:$/, "").trim();
  if (/^professional summary|summary|profil|profile|résumé|resume$/i.test(clean)) return "Summary";
  if (/^work experience|experience|expérience|expériences$/i.test(clean)) return "Experience";
  if (/^education|formation|formations$/i.test(clean)) return "Education";
  if (/^skills|compétences|competences$/i.test(clean)) return "Skills";
  if (/^projects?|projets?$/i.test(clean)) return "Projects";
  if (/^languages?|langues?$/i.test(clean)) return "Languages";
  if (/^certifications?|certificats?$/i.test(clean)) return "Certifications";
  if (/^interests?|centres d'intérêt$/i.test(clean)) return "Interests";
  return clean;
}

function applyHeadingCase(heading: string, mode: LayoutMetadata["headingCapitalization"]) {
  if (mode === "uppercase") return heading.toUpperCase();
  if (mode === "titlecase") {
    return heading
      .split(" ")
      .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word))
      .join(" ");
  }
  return heading;
}

function looksHeading(line: string) {
  const clean = line.replace(/:$/, "").trim();
  if (!clean || clean.length > 42) return false;
  if (/^(Summary|Experience|Education|Skills|Projects|Languages|Certifications|Interests)$/i.test(normalizeHeading(clean))) return true;
  return /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][A-Za-zÀ-ÿ\s]{2,36}$/.test(clean) && !/[.,;!?]/.test(clean);
}

function parseSections(text: string): ResumeSection[] {
  const lines = text.split("\n").map((line) => stripMarkdown(line)).filter(Boolean);
  const sections: ResumeSection[] = [];
  let current: ResumeSection = { heading: "Summary", lines: [] };

  for (const line of lines) {
    if (looksHeading(line)) {
      if (current.lines.length > 0) sections.push(current);
      current = { heading: normalizeHeading(line), lines: [] };
      continue;
    }

    current.lines.push(line.replace(/^[-•▪◦]\s*/, ""));
  }

  if (current.lines.length > 0) sections.push(current);
  return sections;
}

function classifySidebarHeadingsFromOriginal(originalSections: ResumeSection[]) {
  const sidebarSet = new Set<string>();

  for (const section of originalSections) {
    const heading = normalizeHeading(section.heading);
    const averageLineLength =
      section.lines.length > 0
        ? section.lines.reduce((sum, line) => sum + line.length, 0) / section.lines.length
        : 0;

    if (
      SIDEBAR_HEADINGS.has(heading) ||
      (section.lines.length <= 6 && averageLineLength < 40)
    ) {
      sidebarSet.add(heading);
    }
  }

  return sidebarSet;
}

function rebuildSectionsByOriginalOrder(
  originalSections: ResumeSection[],
  optimizedSections: ResumeSection[],
  metadataOrder: string[],
) {
  const optimizedByHeading = new Map<string, ResumeSection>();
  for (const section of optimizedSections) {
    const key = normalizeHeading(section.heading);
    if (!optimizedByHeading.has(key)) {
      optimizedByHeading.set(key, { heading: key, lines: section.lines });
    }
  }

  const skeleton = (metadataOrder.length > 0
    ? metadataOrder.map((item) => normalizeHeading(item))
    : originalSections.map((item) => normalizeHeading(item.heading))
  ).filter(Boolean);

  const rebuilt: ResumeSection[] = [];
  const used = new Set<string>();

  for (const heading of skeleton) {
    const section = optimizedByHeading.get(heading);
    if (!section || section.lines.length === 0) continue;
    rebuilt.push(section);
    used.add(heading);
  }

  for (const [heading, section] of optimizedByHeading.entries()) {
    if (used.has(heading)) continue;
    rebuilt.push(section);
  }

  return rebuilt;
}

function extractContact(text: string): ContactInfo {
  const head = text.split("\n").slice(0, 12).join("\n");

  const email = head.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = head.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?){3,5}\d{2,4}/)?.[0];
  const website = head.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/[\w\-/%]+|github\.com\/[\w\-]+|[\w-]+\.(?:dev|io|com|fr))/i)?.[0];
  const location = head.match(/(?:Paris|Lyon|Marseille|Toulouse|Nantes|Bordeaux|Lille|Remote|France|Belgique|Suisse|Canada)/i)?.[0];

  return {
    email: email ?? undefined,
    phone: phone ?? undefined,
    website: website?.replace(/^https?:\/\//i, "") ?? undefined,
    location: location ?? undefined,
  };
}

function parseExperience(lines: string[]) {
  const entries: Array<{ company: string; role?: string; date?: string; bullets: string[] }> = [];
  let current: { company: string; role?: string; date?: string; bullets: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const bullet = /^[•▪◦-]\s*/.test(rawLine);
    if (!bullet) {
      if (current) entries.push(current);

      const date = line.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Aujourd'hui))/i)?.[0];
      const clean = date ? line.replace(date, "").replace(/[|·•-]\s*$/, "").trim() : line;
      const [company, role] = clean.split(/\s+[—–|-]\s+|\s+\|\s+/);

      current = {
        company: company?.trim() || clean,
        role: role?.trim() || undefined,
        date: date?.trim(),
        bullets: [],
      };
      continue;
    }

    if (!current) {
      current = { company: line.replace(/^[-•▪◦]\s*/, ""), bullets: [] };
      continue;
    }

    current.bullets.push(line.replace(/^[-•▪◦]\s*/, ""));
  }

  if (current) entries.push(current);
  return entries;
}

function renderExperienceSection(section: ResumeSection, headingCase: LayoutMetadata["headingCapitalization"]) {
  const entries = parseExperience(section.lines);

  return `
    <section class="cv-section block-avoid">
      <h2 class="section-title">${escapeHtml(applyHeadingCase(section.heading, headingCase))}</h2>
      <div class="xp-list">
        ${entries
          .map((entry) => {
            const bullets = entry.bullets
              .slice(0, 4)
              .map((b) => `<li>${escapeHtml(b)}</li>`)
              .join("");

            return `
              <article class="xp-item block-avoid">
                <div class="xp-head">
                  <div>
                    <p class="xp-company">${escapeHtml(entry.company)}</p>
                    ${entry.role ? `<p class="xp-role">${escapeHtml(entry.role)}</p>` : ""}
                  </div>
                  ${entry.date ? `<p class="xp-date">${escapeHtml(entry.date)}</p>` : ""}
                </div>
                ${bullets ? `<ul class="xp-bullets">${bullets}</ul>` : ""}
              </article>
            `;
          })
          .join("\n")}
      </div>
    </section>
  `;
}

function renderGenericSection(section: ResumeSection, headingCase: LayoutMetadata["headingCapitalization"]) {
  return `
    <section class="cv-section block-avoid">
      <h2 class="section-title">${escapeHtml(applyHeadingCase(section.heading, headingCase))}</h2>
      <ul class="section-list">
        ${section.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("\n")}
      </ul>
    </section>
  `;
}

function renderSection(section: ResumeSection, headingCase: LayoutMetadata["headingCapitalization"]) {
  if (section.heading === "Experience") return renderExperienceSection(section, headingCase);
  return renderGenericSection(section, headingCase);
}

function renderContact(contact: ContactInfo) {
  const chunks = [contact.email, contact.phone, contact.website, contact.location]
    .filter(Boolean)
    .map((value) => `<span>${escapeHtml(value as string)}</span>`);

  if (!chunks.length) return "";
  return `<div class="contact-row">${chunks.join('<span class="sep">•</span>')}</div>`;
}

function renderCss(variant: TemplateVariant, style: ReturnType<typeof resolveStyleConfig>, metadata: LayoutMetadata) {
  const leftRatio = metadata.sidebarPosition === "left" ? style.sidebarRatio : 1 - style.sidebarRatio;
  const rightRatio = metadata.sidebarPosition === "left" ? 1 - style.sidebarRatio : style.sidebarRatio;

  const sectionGapValue =
    metadata.spacingRhythm === "tight"
      ? Math.max(6, style.sectionGap - 1)
      : metadata.spacingRhythm === "relaxed"
        ? style.sectionGap + 1
        : style.sectionGap;
  const sectionGap = `${sectionGapValue}px`;
  const blockGap = `${style.blockGap}px`;

  return `
    @page { size: A4; margin: ${style.pagePaddingMm}mm; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; width: 100%; height: 100%; }
    body {
      font-family: ${style.fontFamily};
      font-size: ${style.baseFontSize}px;
      line-height: ${style.lineHeight};
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cv-page {
      width: 100%;
      min-height: calc(297mm - ${style.pagePaddingMm * 2}mm);
      max-height: calc(297mm - ${style.pagePaddingMm * 2}mm);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: ${sectionGap};
    }
    .cv-header {
      border-bottom: 1px solid #d5dde8;
      padding-bottom: 6px;
    }
    .cv-name {
      margin: 0;
      font-size: ${style.headerNameSize}px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1.05;
      color: ${style.primaryColor};
    }
    .contact-row {
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      font-size: 9.5px;
      color: #334155;
    }
    .sep { color: #94a3b8; }
    .meta-row { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px; font-size: 9.2px; color: #475569; }
    .cv-content { display: flex; flex-direction: column; gap: ${sectionGap}; }
    .cv-content.two-col { display: grid; grid-template-columns: ${Math.max(0.6, leftRatio).toFixed(2)}fr ${Math.max(0.6, rightRatio).toFixed(2)}fr; gap: ${sectionGap}; align-items: start; }
    .main-col, .side-col { display: flex; flex-direction: column; gap: ${sectionGap}; }
    .cv-section, .block-avoid, .xp-item { break-inside: avoid; page-break-inside: avoid; }
    .section-title {
      margin: 0 0 4px 0;
      padding-bottom: 3px;
      border-bottom: 1px solid #cbd5e1;
      font-size: ${style.sectionTitleSize}px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #0f172a;
    }
    .section-list, .xp-bullets {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .section-list li, .xp-bullets li { margin: 0; color: #1e293b; line-height: 1.27; }
    .section-list li::before, .xp-bullets li::before { content: "• "; font-weight: 700; color: #1e293b; }
    .xp-list { display: flex; flex-direction: column; gap: ${blockGap}; }
    .xp-head { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: baseline; margin-bottom: 1px; }
    .xp-company { margin: 0; font-weight: 700; color: #0f172a; }
    .xp-role { margin: 0; font-weight: 500; color: #334155; }
    .xp-date { margin: 0; font-size: 9.4px; color: #475569; text-align: right; white-space: nowrap; }

    .variant-template_executive_balanced .cv-header {
      border-bottom: none;
      border-radius: 10px;
      background: #0f172a;
      padding: 9px 11px 8px;
    }
    .variant-template_executive_balanced .cv-name { color: #fff; }
    .variant-template_executive_balanced .contact-row,
    .variant-template_executive_balanced .meta-row { color: #cbd5e1; }

    .variant-template_minimal_compact .cv-header { border-bottom: 2px solid #111827; }
    .variant-template_minimal_compact .section-title { border-bottom-color: #111827; }

    .variant-template_two_column_left_v2 .side-col .cv-section,
    .variant-template_two_column_right_v2 .side-col .cv-section {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 5px 6px;
      background: #f8fafc;
    }

    .variant-template_asymmetric_signature .cv-section {
      border-left: 2px solid ${style.accentColor};
      padding-left: 7px;
    }

    @media print {
      .cv-page, .cv-section, .xp-item, .xp-head { break-inside: avoid; page-break-inside: avoid; }
      p, li { orphans: 3; widows: 3; }
    }
  `;
}

export function buildIntelligentResumeHtml(args: BuildArgs): BuildResult {
  const metadata = detectLayoutMetadata({
    originalText: args.originalResumeText,
    requestedTemplate: args.templateChoice,
  });

  const variant = mapLayoutToTemplate(metadata);
  const style = resolveStyleConfig(metadata, variant);

  const originalSections = parseSections(args.originalResumeText);
  const optimizedSections = parseSections(args.optimizedResumeText);
  const sections = rebuildSectionsByOriginalOrder(
    originalSections,
    optimizedSections,
    metadata.sectionOrder,
  );

  const originalSidebarSet = classifySidebarHeadingsFromOriginal(originalSections);
  const sidebarSet = originalSidebarSet.size > 0 ? originalSidebarSet : SIDEBAR_HEADINGS;

  const mainSections = sections.filter((s) => !sidebarSet.has(normalizeHeading(s.heading)));
  const sideSections = sections.filter((s) => sidebarSet.has(normalizeHeading(s.heading)));
  const contact = extractContact(args.originalResumeText);

  const shouldUseTwoCol = metadata.columnCount === 2 && sideSections.length > 0;

  const keywords = (args.keywords ?? []).slice(0, 10).map(escapeHtml).join(" · ");

  const html = `<!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>${renderCss(variant, style, metadata)}</style>
    </head>
    <body>
      <main class="cv-page variant-${variant}">
        <header class="cv-header">
          <h1 class="cv-name">${escapeHtml(args.title)}</h1>
          ${renderContact(contact)}
          <div class="meta-row">
            <span>Template: ${escapeHtml(args.templateChoice)}</span>
            <span>Layout: ${escapeHtml(metadata.layoutType)}</span>
            <span>Match score: ${args.matchScore ?? "N/A"}%</span>
            ${keywords ? `<span>Keywords: ${keywords}</span>` : ""}
          </div>
        </header>

        ${
          shouldUseTwoCol
            ? `<section class="cv-content two-col">
                <div class="main-col">${mainSections
                  .map((section) => renderSection(section, metadata.headingCapitalization))
                  .join("\n")}</div>
                <aside class="side-col">${sideSections
                  .map((section) => renderSection(section, metadata.headingCapitalization))
                  .join("\n")}</aside>
              </section>`
            : `<section class="cv-content">${sections
                .map((section) => renderSection(section, metadata.headingCapitalization))
                .join("\n")}</section>`
        }
      </main>
    </body>
  </html>`;

  return { html, metadata, variant };
}
