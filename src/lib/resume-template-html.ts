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
    <section class="section">
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
  const sections = parseSections(args.resumeText);
  const themeClass = getThemeClass(args.templateChoice);
  const keywords = (args.keywords ?? []).slice(0, 8).map(escapeHtml).join(" • ");

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
          line-height: 1.34;
          background: white;
        }

        .page {
          width: 100%;
          min-height: 100%;
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 8px;
        }

        .header {
          border-bottom: 1px solid #dbe1ea;
          padding-bottom: 7px;
          margin-bottom: 2px;
        }

        .name {
          margin: 0;
          font-size: 22px;
          line-height: 1.05;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .meta {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #334155;
          font-size: 9.6px;
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        h2 {
          font-size: 12.8px;
          line-height: 1.1;
          margin: 0 0 4px 0;
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
          gap: 3px;
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
          gap: 8px;
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
          padding: 10px 10px 8px;
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
      <main class="page ${themeClass}">
        <header class="header">
          <h1 class="name">${escapeHtml(args.title)}</h1>
          <div class="meta">
            <span>Template: ${escapeHtml(args.templateChoice)}</span>
            <span>Match score: ${args.matchScore ?? "N/A"}%</span>
          </div>
          ${keywords ? `<div class="meta"><span>Keywords: ${keywords}</span></div>` : ""}
        </header>
        <section class="content">
          ${sections.map(renderSection).join("\n")}
        </section>
      </main>
    </body>
  </html>`;
}
