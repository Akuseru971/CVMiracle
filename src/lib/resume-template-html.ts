type TemplateChoice = "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";

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

type ParsedResume = {
  profileName: string;
  contact: ContactInfo;
  sections: ResumeSection[];
};

type HtmlTemplateArgs = {
  title: string;
  resumeText: string;
  templateChoice: TemplateChoice;
  matchScore?: number;
  keywords?: string[];
};

type ExperienceEntry = {
  company: string;
  role?: string;
  date?: string;
  bullets: string[];
};

const KNOWN_HEADINGS = [
  "Professional Summary",
  "Summary",
  "Profile",
  "Profil",
  "Résumé",
  "À propos",
  "A propos",
  "Work Experience",
  "Experience",
  "Expérience",
  "Expériences",
  "Education",
  "Formation",
  "Formations",
  "Skills",
  "Compétences",
  "Competences",
  "Compétences techniques",
  "Certifications",
  "Certificats",
  "Projects",
  "Projets",
  "Languages",
  "Langues",
  "Interests",
  "Centres d'intérêt",
];

const SIDEBAR_HEADINGS = new Set(["Skills", "Certifications", "Languages", "Interests"]);

const PRIORITY_ORDER: Record<string, number> = {
  "Professional Summary": 1,
  Summary: 1,
  "Work Experience": 2,
  Experience: 2,
  Education: 3,
  Projects: 4,
  Skills: 5,
  Certifications: 6,
  Languages: 7,
  Interests: 8,
};

const MAX_LINES_BY_SECTION: Record<string, number> = {
  "Professional Summary": 4,
  Summary: 4,
  "Work Experience": 13,
  Experience: 13,
  Education: 6,
  Projects: 6,
  Skills: 9,
  Certifications: 4,
  Languages: 3,
  Interests: 3,
};

const MIN_LINES_BY_SECTION: Record<string, number> = {
  "Professional Summary": 2,
  Summary: 2,
  "Work Experience": 6,
  Experience: 6,
  Education: 2,
  Projects: 1,
  Skills: 3,
  Certifications: 1,
  Languages: 1,
  Interests: 1,
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();
}

function stripLeadingBullet(value: string) {
  return value.replace(/^[-•▪◦]\s*/, "").trim();
}

function isLikelyHeading(line: string) {
  const clean = stripMarkdown(line).replace(/:$/, "").trim();
  if (!clean || clean.length > 46) return false;

  if (KNOWN_HEADINGS.some((item) => item.toLowerCase() === clean.toLowerCase())) {
    return true;
  }

  const noPunctuation = !/[.,;!?]/.test(clean);
  const fewWords = clean.split(/\s+/).length <= 4;
  const startsUpper = /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/.test(clean);
  return noPunctuation && fewWords && startsUpper;
}

function isLikelyName(line: string) {
  if (!line || line.length > 42) return false;
  if (/[@\d]/.test(line)) return false;
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((word) => /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][a-zàâäçéèêëîïôöùûüÿ'’-]+$/.test(word));
}

function normalizeHeading(heading: string) {
  const clean = heading.trim();
  if (/^professional summary$/i.test(clean)) return "Professional Summary";
  if (/^summary$/i.test(clean)) return "Summary";
  if (/^profile|profil|résumé|resume|a propos|à propos$/i.test(clean)) return "Professional Summary";
  if (/^work experience$/i.test(clean)) return "Work Experience";
  if (/^experience|expérience|expériences$/i.test(clean)) return "Experience";
  if (/^education|formation|formations$/i.test(clean)) return "Education";
  if (/^skills|compétences|competences(?: techniques)?$/i.test(clean)) return "Skills";
  if (/^certifications?|certificats?$/i.test(clean)) return "Certifications";
  if (/^projects?|projets?$/i.test(clean)) return "Projects";
  if (/^languages?|langues?$/i.test(clean)) return "Languages";
  if (/^interests?|centres d'intérêt$/i.test(clean)) return "Interests";
  return clean;
}

function extractContact(lines: string[]) {
  const contact: ContactInfo = {};
  const consumed = new Set<number>();

  lines.forEach((rawLine, index) => {
    const line = stripMarkdown(rawLine);

    const email = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    if (email && !contact.email) {
      contact.email = email;
      consumed.add(index);
    }

    const phone = line.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?){3,5}\d{2,4}/)?.[0];
    if (phone && !contact.phone) {
      contact.phone = phone;
      consumed.add(index);
    }

    const website = line.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/[\w\-/%]+|github\.com\/[\w\-]+|[\w-]+\.(?:dev|io|com|fr))/i)?.[0];
    if (website && !contact.website) {
      contact.website = website.replace(/^https?:\/\//i, "");
      consumed.add(index);
    }

    if (!contact.location && /(?:Paris|Lyon|Marseille|Toulouse|Nantes|Bordeaux|Lille|Remote|France|Belgique|Suisse|Montréal|Montreal|Canada)/i.test(line)) {
      contact.location = line;
      consumed.add(index);
    }
  });

  return { contact, consumed };
}

function parseResume(raw: string, fallbackTitle: string): ParsedResume {
  const lines = raw
    .split("\n")
    .map((line) => stripMarkdown(line.trim()))
    .filter(Boolean);

  const profileName = isLikelyName(lines[0] ?? "") ? lines[0] : fallbackTitle;
  const { contact, consumed } = extractContact(lines.slice(0, 10));

  const sections: ResumeSection[] = [];
  let current: ResumeSection = { heading: "Professional Summary", lines: [] };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!line) continue;
    if (i === 0 && isLikelyName(line)) continue;
    if (consumed.has(i)) continue;

    const headingCandidate = line.replace(/:$/, "").trim();
    if (isLikelyHeading(headingCandidate)) {
      if (current.lines.length > 0) {
        sections.push(current);
      }
      current = { heading: normalizeHeading(headingCandidate), lines: [] };
      continue;
    }

    current.lines.push(stripLeadingBullet(line));
  }

  if (current.lines.length > 0) {
    sections.push(current);
  }

  return {
    profileName,
    contact,
    sections,
  };
}

function truncateLine(line: string, maxChars: number) {
  const clean = line.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function estimateLineUnits(line: string) {
  const bare = stripLeadingBullet(line);
  return Math.max(1, Math.ceil(bare.length / 94));
}

function estimateSectionUnits(section: ResumeSection) {
  const headingCost = 1.6;
  const linesCost = section.lines.reduce((sum, line) => sum + estimateLineUnits(line), 0);
  return headingCost + linesCost;
}

function fitSectionsForOnePage(sections: ResumeSection[], templateChoice: TemplateChoice) {
  const budget = templateChoice === "Minimal ATS" ? 95 : templateChoice === "Modern Executive" ? 92 : 93;

  const fitted = sections.map((section) => {
    const heading = normalizeHeading(section.heading);
    const maxLines = MAX_LINES_BY_SECTION[heading] ?? 7;
    const limited = section.lines.slice(0, maxLines).map((line) => truncateLine(line, 170));
    return { heading, lines: limited };
  });

  const currentUnits = () => fitted.reduce((sum, section) => sum + estimateSectionUnits(section), 0);

  let units = currentUnits();
  while (units > budget) {
    const removable = fitted
      .map((section, index) => ({
        index,
        section,
        priority: PRIORITY_ORDER[section.heading] ?? 10,
        minLines: MIN_LINES_BY_SECTION[section.heading] ?? 1,
      }))
      .filter((item) => item.section.lines.length > item.minLines)
      .sort((a, b) => b.priority - a.priority);

    if (removable.length === 0) break;

    removable[0].section.lines.pop();
    units = currentUnits();
  }

  const densityClass = units > budget * 0.93 ? "density-tight" : units > budget * 0.82 ? "density-normal" : "density-relaxed";

  return { fitted, densityClass };
}

function parseExperienceEntries(lines: string[]) {
  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | null = null;

  for (const rawLine of lines) {
    const line = stripLeadingBullet(rawLine);
    if (!line) continue;

    const isBullet = /^[-•▪◦]/.test(rawLine);

    if (!isBullet) {
      if (current) {
        entries.push(current);
      }

      const dateMatch = line.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Aujourd'hui|Now|Current))$/i);
      const date = dateMatch?.[0]?.trim();
      const header = date ? line.slice(0, -date.length).trim().replace(/[|·•-]\s*$/, "") : line;

      const split = header.split(/\s+[—–|-]\s+|\s+\|\s+/);
      const company = split[0]?.trim() || header;
      const role = split.slice(1).join(" • ").trim() || undefined;

      current = {
        company,
        role,
        date,
        bullets: [],
      };
    } else if (current) {
      current.bullets.push(line);
    } else {
      current = {
        company: line,
        bullets: [],
      };
    }
  }

  if (current) {
    entries.push(current);
  }

  return entries;
}

function renderSectionHeader(heading: string) {
  return `<h2 class="section-title">${escapeHtml(heading)}</h2>`;
}

function renderExperienceSection(section: ResumeSection) {
  const entries = parseExperienceEntries(section.lines);

  const roleMarkup = entries
    .map((entry) => {
      const bullets = entry.bullets
        .slice(0, 4)
        .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
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
    .join("\n");

  return `
    <section class="cv-section block-avoid">
      ${renderSectionHeader(section.heading)}
      <div class="xp-list">${roleMarkup}</div>
    </section>
  `;
}

function renderGenericSection(section: ResumeSection) {
  const items = section.lines
    .map((line) => `<li>${escapeHtml(stripLeadingBullet(line))}</li>`)
    .join("");

  return `
    <section class="cv-section block-avoid">
      ${renderSectionHeader(section.heading)}
      <ul class="section-list">${items}</ul>
    </section>
  `;
}

function renderContact(contact: ContactInfo) {
  const parts = [contact.email, contact.phone, contact.website, contact.location]
    .filter(Boolean)
    .map((value) => `<span>${escapeHtml(value as string)}</span>`);

  if (parts.length === 0) return "";

  return `<div class="contact-row">${parts.join('<span class="sep">•</span>')}</div>`;
}

function getThemeClass(templateChoice: TemplateChoice) {
  if (templateChoice === "Modern Executive") return "theme-executive";
  if (templateChoice === "Minimal ATS") return "theme-ats";
  return "theme-original";
}

function renderSection(section: ResumeSection) {
  if (section.heading === "Experience" || section.heading === "Work Experience") {
    return renderExperienceSection(section);
  }

  return renderGenericSection(section);
}

export function buildResumeHtmlTemplate(args: HtmlTemplateArgs) {
  const parsed = parseResume(args.resumeText, args.title);
  const { fitted: sections, densityClass } = fitSectionsForOnePage(parsed.sections, args.templateChoice);
  const themeClass = getThemeClass(args.templateChoice);

  const keywordsText = (args.keywords ?? []).slice(0, 8).map(escapeHtml).join(" · ");

  const mainSections = sections.filter((section) => !SIDEBAR_HEADINGS.has(section.heading));
  const sideSections = sections.filter((section) => SIDEBAR_HEADINGS.has(section.heading));

  const contentMarkup =
    args.templateChoice === "Modern Executive"
      ? `
        <section class="cv-content two-col">
          <div class="main-col">
            ${mainSections.map(renderSection).join("\n")}
          </div>
          <aside class="side-col">
            ${sideSections.map(renderSection).join("\n")}
          </aside>
        </section>
      `
      : `
        <section class="cv-content single-col">
          ${sections.map(renderSection).join("\n")}
        </section>
      `;

  return `<!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page {
          size: A4;
          margin: 7.5mm 9mm;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-family: "Inter", "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif;
        }

        body {
          font-size: 10.8px;
          line-height: 1.3;
          color: #0f172a;
        }

        .cv-page {
          width: 100%;
          min-height: calc(297mm - 15mm);
          max-height: calc(297mm - 15mm);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .density-tight {
          font-size: 10.5px;
          line-height: 1.22;
        }

        .density-normal {
          font-size: 10.8px;
          line-height: 1.28;
        }

        .density-relaxed {
          font-size: 11px;
          line-height: 1.33;
        }

        .cv-header {
          padding-bottom: 6px;
          border-bottom: 1px solid #d5dde8;
        }

        .cv-name {
          margin: 0;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: 0.02em;
          line-height: 1.05;
          color: #0b1220;
        }

        .contact-row {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 5px;
          color: #334155;
          font-size: 9.5px;
        }

        .sep {
          color: #94a3b8;
        }

        .meta-row {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          color: #475569;
          font-size: 9.2px;
        }

        .cv-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .two-col {
          display: grid;
          grid-template-columns: 2fr 0.96fr;
          gap: 10px;
          align-items: start;
        }

        .main-col,
        .side-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cv-section,
        .block-avoid,
        .xp-item {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .cv-section {
          margin: 0;
          padding: 0;
        }

        .section-title {
          margin: 0 0 4px 0;
          padding: 0 0 3px 0;
          border-bottom: 1px solid #cbd5e1;
          font-size: 12.4px;
          font-weight: 700;
          line-height: 1.1;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #0f172a;
        }

        .section-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .section-list li {
          margin: 0;
          color: #1e293b;
          line-height: 1.28;
        }

        .section-list li::before {
          content: "• ";
          color: #1e293b;
          font-weight: 700;
        }

        .xp-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .xp-item {
          margin: 0;
          padding: 0;
        }

        .xp-head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 7px;
          align-items: baseline;
          margin-bottom: 1px;
        }

        .xp-company {
          margin: 0;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .xp-role {
          margin: 0;
          font-weight: 500;
          color: #334155;
          line-height: 1.2;
        }

        .xp-date {
          margin: 0;
          color: #475569;
          font-size: 9.4px;
          text-align: right;
          white-space: nowrap;
          line-height: 1.2;
        }

        .xp-bullets {
          margin: 2px 0 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .xp-bullets li {
          margin: 0;
          line-height: 1.27;
          color: #1e293b;
        }

        .xp-bullets li::before {
          content: "• ";
          font-weight: 700;
          color: #1e293b;
        }

        .theme-executive .cv-header {
          border-bottom: none;
          background: #0f172a;
          color: #f8fafc;
          border-radius: 10px;
          padding: 9px 11px 8px;
        }

        .theme-executive .cv-name {
          color: #ffffff;
        }

        .theme-executive .contact-row,
        .theme-executive .meta-row {
          color: #cbd5e1;
        }

        .theme-executive .sep {
          color: #64748b;
        }

        .theme-executive .side-col .cv-section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 5px 6px;
          background: #f8fafc;
        }

        .theme-executive .section-title {
          border-bottom-color: #cbd5e1;
        }

        .theme-original {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .theme-original .cv-header {
          border-bottom: 2px solid #e2e8f0;
        }

        .theme-original .cv-section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 5px 6px;
          background: #ffffff;
        }

        .theme-ats .cv-header {
          border-bottom: 2px solid #111827;
        }

        .theme-ats .section-title {
          border-bottom-color: #111827;
        }

        .theme-ats .cv-name {
          letter-spacing: 0.01em;
        }
      </style>
    </head>
    <body>
      <main class="cv-page ${themeClass} ${densityClass}">
        <header class="cv-header">
          <h1 class="cv-name">${escapeHtml(parsed.profileName)}</h1>
          ${renderContact(parsed.contact)}
          <div class="meta-row">
            <span>Template: ${escapeHtml(args.templateChoice)}</span>
            <span>Match score: ${args.matchScore ?? "N/A"}%</span>
            ${keywordsText ? `<span>Keywords: ${keywordsText}</span>` : ""}
          </div>
        </header>

        ${contentMarkup}
      </main>
    </body>
  </html>`;
}
