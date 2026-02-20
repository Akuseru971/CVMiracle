type TemplateChoice = "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";

type ResumeSection = {
  heading: string;
  lines: string[];
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
  "Work Experience",
  "Experience",
  "Education",
  "Skills",
  "Certifications",
  "Projects",
  "Languages",
];

const SIDEBAR_HEADINGS = new Set(["Skills", "Certifications", "Languages"]);

const PRIORITY_ORDER: Record<string, number> = {
  "Professional Summary": 1,
  Summary: 1,
  Profile: 1,
  "Work Experience": 2,
  Experience: 2,
  Education: 3,
  Projects: 4,
  Skills: 5,
  Certifications: 6,
  Languages: 7,
};

const MAX_LINES_BY_SECTION: Record<string, number> = {
  "Professional Summary": 5,
  Summary: 5,
  Profile: 5,
  "Work Experience": 14,
  Experience: 14,
  Education: 7,
  Projects: 6,
  Skills: 10,
  Certifications: 4,
  Languages: 3,
};

const MIN_LINES_BY_SECTION: Record<string, number> = {
  "Professional Summary": 2,
  Summary: 2,
  Profile: 2,
  "Work Experience": 6,
  Experience: 6,
  Education: 2,
  Projects: 1,
  Skills: 3,
  Certifications: 1,
  Languages: 1,
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseSections(raw: string): ResumeSection[] {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: ResumeSection[] = [];
  let current: ResumeSection = { heading: "Profile", lines: [] };

  for (const line of lines) {
    const clean = line.replace(/:$/, "");
    const looksHeading =
      KNOWN_HEADINGS.includes(clean) ||
      (/^[A-Z][A-Za-z\s]{3,40}$/.test(clean) && line.length < 45 && !line.startsWith("-"));

    if (looksHeading) {
      if (current.lines.length) sections.push(current);
      current = { heading: clean, lines: [] };
      continue;
    }

    current.lines.push(line);
  }

  if (current.lines.length) sections.push(current);
  return sections;
}

function normalizeHeading(heading: string) {
  const clean = heading.trim();
  if (/^professional summary$/i.test(clean)) return "Professional Summary";
  if (/^summary$/i.test(clean)) return "Summary";
  if (/^work experience$/i.test(clean)) return "Work Experience";
  if (/^experience$/i.test(clean)) return "Experience";
  if (/^education$/i.test(clean)) return "Education";
  if (/^skills$/i.test(clean)) return "Skills";
  if (/^certifications?$/i.test(clean)) return "Certifications";
  if (/^projects?$/i.test(clean)) return "Projects";
  if (/^languages?$/i.test(clean)) return "Languages";
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
      const bullet = line.startsWith("-") || line.startsWith("•");
      const cleaned = bullet ? line.replace(/^[-•]\s*/, "") : line;
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

export function buildResumeHtmlTemplate(args: HtmlTemplateArgs) {
  const parsedSections = parseSections(args.resumeText);
  const { fitted: sections, densityClass } = fitSectionsForOnePage(parsedSections, args.templateChoice);
  const themeClass = getThemeClass(args.templateChoice);
  const keywords = (args.keywords ?? []).slice(0, 8).map(escapeHtml).join(" • ");

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
          font-size: 10.8px;
          line-height: 1.3;
          background: white;
        }

        .page {
          width: 100%;
          height: 276mm;
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 6px;
          overflow: hidden;
        }

        .density-tight { font-size: 10.45px; line-height: 1.24; }
        .density-normal { font-size: 10.75px; line-height: 1.29; }
        .density-relaxed { font-size: 10.95px; line-height: 1.32; }

        .header {
          border-bottom: 1px solid #dbe1ea;
          padding-bottom: 6px;
          margin-bottom: 1px;
        }

        .name {
          margin: 0;
          font-size: 23px;
          line-height: 1.05;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .meta {
          margin-top: 3px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #334155;
          font-size: 9.4px;
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .single-col {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1.9fr 1fr;
          gap: 10px;
          align-items: start;
        }

        .main-col,
        .side-col {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .section,
        .block-avoid {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        h2 {
          font-size: 12.6px;
          line-height: 1.1;
          margin: 0 0 3px 0;
          padding-bottom: 2px;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2.4px;
        }

        .item {
          margin: 0;
          color: #1e293b;
          break-inside: avoid;
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

        .theme-executive .header {
          border-bottom: none;
          padding: 9px 10px 8px;
          border-radius: 10px;
          background: #0f172a;
          color: #f8fafc;
        }

        .theme-executive .name { color: #ffffff; }
        .theme-executive .meta { color: #cbd5e1; }
        .theme-executive h2 { border-bottom-color: #cbd5e1; }

        .theme-ats .name { font-size: 21px; }
        .theme-ats h2 { text-transform: uppercase; font-size: 12px; letter-spacing: 0.04em; }
        .theme-ats .item { font-size: 10.5px; }

        .theme-original .section {
          padding: 4px 5px;
          border-radius: 6px;
          background: #f8fafc;
        }

        .theme-original h2 {
          border-bottom-color: #d1d9e4;
        }
      </style>
    </head>
    <body>
      <main class="page ${themeClass} ${densityClass}">
        <header class="header">
          <h1 class="name">${escapeHtml(args.title)}</h1>
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
