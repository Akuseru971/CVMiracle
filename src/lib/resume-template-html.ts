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

const KNOWN_HEADINGS = [
  "Professional Summary",
  "Summary",
  "Profile",
  "Profil",
  "Résumé",
  "À propos",
  "Work Experience",
  "Experience",
  "Expérience",
  "Expériences",
  "Education",
  "Formation",
  "Formations",
  "Skills",
  "Compétences",
  "Compétences techniques",
  "Certifications",
  "Certificats",
  "Certificat",
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
  Profile: 1,
  Profil: 1,
  "Work Experience": 2,
  Experience: 2,
  Expérience: 2,
  Education: 3,
  Formation: 3,
  Projects: 4,
  Projets: 4,
  Skills: 5,
  Compétences: 5,
  Certifications: 6,
  Certificats: 6,
  Languages: 7,
  Langues: 7,
  Interests: 8,
};

const MAX_LINES_BY_SECTION: Record<string, number> = {
  "Professional Summary": 5,
  Summary: 5,
  Profile: 5,
  Profil: 5,
  "Work Experience": 14,
  Experience: 14,
  Expérience: 14,
  Education: 7,
  Formation: 7,
  Projects: 6,
  Projets: 6,
  Skills: 10,
  Compétences: 10,
  Certifications: 4,
  Certificats: 4,
  Languages: 3,
  Langues: 3,
  Interests: 3,
};

const MIN_LINES_BY_SECTION: Record<string, number> = {
  "Professional Summary": 2,
  Summary: 2,
  Profile: 2,
  Profil: 2,
  "Work Experience": 6,
  Experience: 6,
  Expérience: 6,
  Education: 2,
  Formation: 2,
  Projects: 1,
  Projets: 1,
  Skills: 3,
  Compétences: 3,
  Certifications: 1,
  Certificats: 1,
  Languages: 1,
  Langues: 1,
  Interests: 1,
};

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
  const normalized = stripMarkdown(line).replace(/:$/, "").trim();
  if (!normalized || normalized.length > 46) return false;
  if (KNOWN_HEADINGS.some((h) => h.toLowerCase() === normalized.toLowerCase())) return true;

  const noPunctuation = !/[.,;!?]/.test(normalized);
  const fewWords = normalized.split(/\s+/).length <= 4;
  const startsUpper = /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/.test(normalized);
  return noPunctuation && fewWords && startsUpper;
}

function isLikelyName(line: string) {
  if (!line || line.length > 42) return false;
  if (/[@\d]/.test(line)) return false;
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((word) => /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][a-zàâäçéèêëîïôöùûüÿ'’-]+$/.test(word));
}

function extractContact(lines: string[]) {
  const contact: ContactInfo = {};
  const consumed = new Set<number>();

  lines.forEach((raw, index) => {
    const line = stripMarkdown(raw);
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

    const site = line.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/[\w\-/%]+|github\.com\/[\w\-]+|[\w-]+\.(?:dev|io|com|fr))/i)?.[0];
    if (site && !contact.website) {
      contact.website = site.replace(/^https?:\/\//i, "");
      consumed.add(index);
    }

    if (!contact.location && /(?:Paris|Lyon|Marseille|Toulouse|Nantes|Bordeaux|Lille|Remote|France|Belgique|Suisse)/i.test(line)) {
      contact.location = line;
      consumed.add(index);
    }
  });

  return { contact, consumed };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

    const clean = line.replace(/:$/, "").trim();
    const looksHeading = isLikelyHeading(clean);

    if (looksHeading) {
      if (current.lines.length) sections.push(current);
      current = { heading: clean, lines: [] };
      continue;
    }

    current.lines.push(stripLeadingBullet(line));
  }

  if (current.lines.length) sections.push(current);
  return {
    profileName,
    contact,
    sections,
  };
}

function normalizeHeading(heading: string) {
  const clean = heading.trim();
  if (/^professional summary$/i.test(clean)) return "Professional Summary";
  if (/^summary$/i.test(clean)) return "Summary";
  if (/^profile|profil|résumé|a propos|à propos$/i.test(clean)) return "Professional Summary";
  if (/^work experience$/i.test(clean)) return "Work Experience";
  if (/^experience|expérience|expériences$/i.test(clean)) return "Experience";
  if (/^education$/i.test(clean)) return "Education";
  if (/^formation|formations$/i.test(clean)) return "Education";
  if (/^skills|compétences|competences(?: techniques)?$/i.test(clean)) return "Skills";
  if (/^certifications?|certificats?|certificat$/i.test(clean)) return "Certifications";
  if (/^projects?|projets?$/i.test(clean)) return "Projects";
  if (/^languages?|langues?$/i.test(clean)) return "Languages";
  if (/^interests?|centres d'intérêt$/i.test(clean)) return "Interests";
  return clean;
}

function truncateLine(line: string, maxChars: number) {
  const clean = line.trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function estimateLineUnits(line: string) {
  const bare = line.replace(/^[-•]\s*/, "");
  return Math.max(1, Math.ceil(bare.length / 96));
}

function estimateSectionUnits(section: ResumeSection) {
  return 1.5 + section.lines.reduce((sum, line) => sum + estimateLineUnits(line), 0);
}

function fitSectionsForOnePage(sections: ResumeSection[], templateChoice: TemplateChoice) {
  const budget = templateChoice === "Minimal ATS" ? 98 : templateChoice === "Modern Executive" ? 93 : 95;

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

function renderSection(section: ResumeSection) {
  const items = section.lines
    .map((line) => {
      const bullet = /^[-•▪◦]/.test(line);
      const cleaned = stripLeadingBullet(line);
      const dateMatch = cleaned.match(/(.+?)\s+(\d{4}\s*[-–]\s*(?:\d{4}|Present))$/i);

      if (dateMatch) {
        return `<li class="item row">
          <span class="row-main">${escapeHtml(dateMatch[1])}</span>
          <span class="row-date">${escapeHtml(dateMatch[2])}</span>
        </li>`;
      }

      return `<li class="item ${bullet ? "bullet" : ""}">${escapeHtml(cleaned)}</li>`;
    })
    .join("");

  return `
    <section class="section block-avoid">
      <h2>${escapeHtml(section.heading)}</h2>
      <ul>${items}</ul>
    </section>
  `;
}

function getThemeClass(templateChoice: TemplateChoice) {
  if (templateChoice === "Modern Executive") return "theme-executive";
  if (templateChoice === "Minimal ATS") return "theme-ats";
  return "theme-original";
}

function renderContact(contact: ContactInfo) {
  const chunks = [contact.email, contact.phone, contact.website, contact.location]
    .filter(Boolean)
    .map((value) => `<span>${escapeHtml(value as string)}</span>`);
  if (chunks.length === 0) return "";
  return `<div class="contact">${chunks.join("<span class=\"sep\">•</span>")}</div>`;
}

export function buildResumeHtmlTemplate(args: HtmlTemplateArgs) {
  const parsed = parseResume(args.resumeText, args.title);
  const parsedSections = parsed.sections;
  const { fitted: sections, densityClass } = fitSectionsForOnePage(parsedSections, args.templateChoice);
  const themeClass = getThemeClass(args.templateChoice);
  const keywords = (args.keywords ?? []).slice(0, 8).map(escapeHtml).join(" · ");

  const mainSections = sections.filter((section) => !SIDEBAR_HEADINGS.has(section.heading));
  const sideSections = sections.filter((section) => SIDEBAR_HEADINGS.has(section.heading));

  const contentMarkup =
    args.templateChoice === "Modern Executive"
      ? `
      <section class="content two-col">
        <div class="main-col">
          ${mainSections.map(renderSection).join("\n")}
        </div>
        <aside class="side-col">
          ${sideSections.map(renderSection).join("\n")}
        </aside>
      </section>`
      : `
      <section class="content single-col">
        ${sections.map(renderSection).join("\n")}
      </section>`;

  return `<!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page {
          size: A4;
          margin: 10mm 11mm 10mm 11mm;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: Inter, Helvetica, Arial, sans-serif;
          color: #0f172a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-size: 10.7px;
          line-height: 1.3;
          background: white;
        }

        .page {
          width: 100%;
          height: 276mm;
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 7px;
          overflow: hidden;
          padding: 10mm 11mm;
        }

        .density-tight { font-size: 10.45px; line-height: 1.24; }
        .density-normal { font-size: 10.75px; line-height: 1.29; }
        .density-relaxed { font-size: 10.95px; line-height: 1.32; }

        .header {
          border-bottom: 1px solid #dbe1ea;
          padding-bottom: 7px;
        }

        .name {
          margin: 0;
          font-size: 24px;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .meta {
          margin-top: 4px;
          display: flex;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 10px;
          color: #334155;
          font-size: 9.4px;
        }

        .contact {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          color: #334155;
          font-size: 9.4px;
        }

        .sep { color: #94a3b8; }

        .content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .single-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .two-col {
          display: grid;
          grid-template-columns: 2fr 0.95fr;
          gap: 11px;
          align-items: start;
        }

        .main-col,
        .side-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section,
        .block-avoid {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        h2 {
          font-size: 12px;
          line-height: 1.1;
          margin: 0 0 4px 0;
          padding-bottom: 3px;
          border-bottom: 1px solid #cbd5e1;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .item {
          margin: 0;
          color: #1e293b;
          break-inside: avoid;
          line-height: 1.28;
        }

        .item.bullet::before {
          content: "• ";
          color: #0f172a;
          font-weight: 700;
        }

        .row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 7px;
          align-items: baseline;
        }

        .row-main {
          font-weight: 500;
        }

        .row-date {
          color: #475569;
          text-align: right;
          white-space: nowrap;
          font-size: 9.5px;
        }

        .theme-original {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .theme-original .header {
          border-bottom: 2px solid #e2e8f0;
        }

        .theme-original .name {
          color: #0f172a;
        }

        .theme-original .section {
          padding: 5px 6px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
        }

        .theme-executive .header {
          border-bottom: none;
          padding: 10px 12px 9px;
          border-radius: 12px;
          background: #0f172a;
          color: #f8fafc;
        }

        .theme-executive .name { color: #ffffff; }
        .theme-executive .meta { color: #cbd5e1; }
        .theme-executive .contact { color: #cbd5e1; }
        .theme-executive .sep { color: #64748b; }
        .theme-executive .side-col .section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 5px 6px;
          background: #f8fafc;
        }
        .theme-executive h2 { border-bottom-color: #cbd5e1; }

        .theme-ats {
          background: #ffffff;
        }

        .theme-ats .header {
          border-bottom: 2px solid #111827;
        }

        .theme-ats .name {
          font-size: 22px;
          letter-spacing: 0;
        }

        .theme-ats h2 {
          border-bottom-color: #111827;
          color: #111827;
        }

        .theme-ats .item {
          font-size: 10.35px;
          color: #0f172a;
        }
      </style>
    </head>
    <body>
      <main class="page ${themeClass} ${densityClass}">
        <header class="header">
          <h1 class="name">${escapeHtml(parsed.profileName)}</h1>
          ${renderContact(parsed.contact)}
          <div class="meta">
            <span>Template: ${escapeHtml(args.templateChoice)}</span>
            <span>Match score: ${args.matchScore ?? "N/A"}%</span>
          </div>
          ${keywords ? `<div class="meta"><span>Keywords: ${keywords}</span></div>` : ""}
        </header>
        ${contentMarkup}
      </main>
    </body>
  </html>`;
}
