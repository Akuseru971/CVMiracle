import { normalizeTemplateChoice, type TemplateChoice } from "@/lib/template-options";
import type { StructuredCv } from "@/lib/cv-structure";

type BuildArgs = {
  title: string;
  originalResumeText: string;
  optimizedResumeText: string;
  structuredCv?: StructuredCv;
  templateChoice: string;
  matchScore?: number;
  keywords?: string[];
};

type RawResumeSection = {
  heading: string;
  lines: string[];
};

type ExperienceEntry = {
  title: string;
  company?: string;
  date?: string;
  bullets: string[];
};

type StructuredCvData = {
  summaryLines: string[];
  experience: ExperienceEntry[];
  educationLines: string[];
  skillLines: string[];
  languageLines: string[];
  additionalLines: string[];
};

type ContactInfo = {
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
};

type BuildResult = {
  html: string;
  metadata: {
    templateChoice: TemplateChoice;
  };
  variant: TemplateChoice;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeHeading(heading: string) {
  const clean = heading.replace(/:$/, "").trim();
  if (/^professional summary|summary|profil|profile|résumé|resume|about$/i.test(clean)) return "Summary";
  if (/^work experience|experience|expérience|expériences|employment|career$/i.test(clean)) return "Experience";
  if (/^education|formation|formations|academic background$/i.test(clean)) return "Education";
  if (/^skills|compétences|competences|technical skills|core skills$/i.test(clean)) return "Skills";
  if (/^projects?|projets?$/i.test(clean)) return "Projects";
  if (/^languages?|langues?$/i.test(clean)) return "Languages";
  if (/^certifications?|certificats?|licenses?$/i.test(clean)) return "Certifications";
  return clean;
}

function looksHeading(line: string) {
  const clean = line.replace(/:$/, "").trim();
  if (!clean || clean.length > 54) return false;
  const normalized = normalizeHeading(clean);
  if (/^(Summary|Experience|Education|Skills|Projects|Languages|Certifications)$/i.test(normalized)) {
    return true;
  }
  return /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][A-Za-zÀ-ÿ\s&/]{2,40}$/.test(clean) && !/[.;!?]/.test(clean);
}

function parseSectionsRaw(text: string): RawResumeSection[] {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").trim())
    .filter(Boolean);
  const sections: RawResumeSection[] = [];
  let current: RawResumeSection = { heading: "Summary", lines: [] };

  for (const line of lines) {
    if (looksHeading(line)) {
      if (current.lines.length > 0) sections.push(current);
      current = { heading: normalizeHeading(line), lines: [] };
      continue;
    }

    current.lines.push(line);
  }

  if (current.lines.length > 0) sections.push(current);
  return sections;
}

function splitSkillLine(line: string) {
  return line
    .split(/[,|•·]/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 1);
}

function extractContact(text: string): ContactInfo {
  const head = text.split("\n").slice(0, 14).join("\n");

  return {
    email: head.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0],
    phone: head.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?){3,5}\d{2,4}/)?.[0],
    website: head
      .match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/[\w\-/%]+|github\.com\/[\w\-]+|[\w-]+\.(?:dev|io|com|fr))/i)?.[0]
      ?.replace(/^https?:\/\//i, ""),
    location: head.match(/(?:Paris|Lyon|Marseille|Toulouse|Nantes|Bordeaux|Lille|Remote|France|Belgique|Suisse|Canada)/i)?.[0],
  };
}

function parseExperience(lines: string[]) {
  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | null = null;
  const dateRegex = /(\b(?:19|20)\d{2}\b\s*[-–—]\s*(?:\b(?:19|20)\d{2}\b|Present|Current|Aujourd'hui|Now))/i;

  const looksCompanyLine = (value: string) => {
    return /\s[—–-]\s/.test(value) && !dateRegex.test(value) && value.length <= 90;
  };

  const parseHeader = (value: string) => {
    const date = value.match(dateRegex)?.[0];
    const withoutDate = date ? value.replace(date, "").trim() : value;
    const parts = withoutDate.split(/\s+[|]\s+|\s+[—–]\s+|\s+-\s+/).map((item) => item.trim()).filter(Boolean);

    if (parts.length >= 2) {
      return {
        title: parts[0],
        company: parts.slice(1).join(" — "),
        date,
      };
    }

    return {
      title: withoutDate.replace(/[|·•-]\s*$/, "").trim(),
      company: undefined,
      date,
    };
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const isBullet = /^[•▪◦-]\s*/.test(rawLine);
    const hasDate = dateRegex.test(line);
    const looksHeader = hasDate || /\||\s[—–-]\s/.test(line) || line.length < 85;

    if (!isBullet && current && !current.company && !hasDate && looksCompanyLine(line)) {
      current.company = line;
      continue;
    }

    if (!isBullet && looksHeader) {
      if (current) entries.push(current);
      const parsed = parseHeader(line);
      current = { title: parsed.title, company: parsed.company, date: parsed.date, bullets: [] };
      continue;
    }

    if (!current) {
      current = { title: line.replace(/^[-•▪◦]\s*/, ""), bullets: [] };
      continue;
    }

    const cleaned = line.replace(/^[-•▪◦]\s*/, "").trim();
    if (cleaned && !dateRegex.test(cleaned) && cleaned !== current.title && cleaned !== current.company) {
      current.bullets.push(cleaned);
    }
  }

  if (current) entries.push(current);
  return entries.filter((entry) => entry.title.length > 1);
}

function inferExperienceFromUnstructuredLines(lines: string[]) {
  const candidateLines: string[] = [];
  const dateRegex = /(\b(?:19|20)\d{2}\b\s*[-–—]\s*(?:\b(?:19|20)\d{2}\b|Present|Current|Aujourd'hui|Now))/i;

  for (const line of lines) {
    const clean = line.trim();
    if (!clean) continue;
    if (looksHeading(clean)) continue;

    if (
      dateRegex.test(clean) ||
      /^[•▪◦-]\s+/.test(clean) ||
      /\s[—–-]\s/.test(clean) ||
      /manager|engineer|developer|consultant|analyst|lead|director|coordinator|specialist/i.test(clean)
    ) {
      candidateLines.push(clean);
    }
  }

  return parseExperience(candidateLines);
}

function toStructuredCvData(optimizedResumeText: string): StructuredCvData {
  const rawSections = parseSectionsRaw(optimizedResumeText);
  const sections = rawSections.map((section) => ({
    heading: section.heading,
    lines: section.lines.map((line) => line.replace(/^[-•▪◦]\s*/, "").trim()),
  }));

  const getLines = (...names: string[]) =>
    sections
      .filter((section) => names.includes(section.heading))
      .flatMap((section) => section.lines)
      .filter(Boolean);

  const getRawLines = (...names: string[]) =>
    rawSections
      .filter((section) => names.includes(section.heading))
      .flatMap((section) => section.lines)
      .filter(Boolean);

  const summaryLines = getLines("Summary");
  const experienceLinesRaw = getRawLines("Experience");
  const educationLines = getLines("Education", "Projects").slice(0, 14);
  const rawSkills = getLines("Skills");
  const rawLanguages = getLines("Languages");
  const rawAdditional = getLines("Certifications", "Projects");

  const skillLines = rawSkills
    .flatMap((line) => splitSkillLine(line))
    .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 18);

  const languageLines = rawLanguages
    .flatMap((line) => splitSkillLine(line))
    .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 10);

  const additionalLines = rawAdditional
    .flatMap((line) => splitSkillLine(line))
    .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 12);

  const fallbackSummary = sections
    .filter((section) => section.heading !== "Experience")
    .flatMap((section) => section.lines)
    .filter((line) => line.length > 32)
    .slice(0, 3);

  let experience = parseExperience(experienceLinesRaw);
  if (experience.length === 0) {
    const allRawLines = rawSections.flatMap((section) => section.lines);
    experience = inferExperienceFromUnstructuredLines(allRawLines);
  }

  return {
    summaryLines: summaryLines.length > 0 ? summaryLines.slice(0, 4) : fallbackSummary,
    experience,
    educationLines,
    skillLines,
    languageLines,
    additionalLines,
  };
}

function renderExperienceBlock(entries: ExperienceEntry[]) {

  return entries
    .map((entry) => {
      const bullets = entry.bullets
        .slice(0, 4)
        .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
        .join("\n");

      return `<div class="job">
  <div class="job-header">
    <div class="job-info">
      <div class="job-title">${escapeHtml(entry.title)}</div>
      ${entry.company ? `<div class="company">${escapeHtml(entry.company)}</div>` : ""}
    </div>
    ${entry.date ? `<span class="job-date">${escapeHtml(entry.date)}</span>` : ""}
  </div>
  ${bullets ? `<ul>${bullets}</ul>` : ""}
</div>`;
    })
    .join("\n");
}

function renderEducationBlock(lines: string[]) {
  return `<ul>${lines.slice(0, 12).map((line) => `<li>${escapeHtml(line)}</li>`).join("\n")}</ul>`;
}

function renderSkillsBlock(lines: string[]) {
  return `<ul>${lines.slice(0, 20).map((line) => `<li>${escapeHtml(line)}</li>`).join("\n")}</ul>`;
}

function renderAdditionalBlock(lines: string[]) {
  if (!lines.length) return "";
  return `<ul>${lines.slice(0, 12).map((line) => `<li>${escapeHtml(line)}</li>`).join("\n")}</ul>`;
}

function renderSummary(lines: string[]) {
  return escapeHtml(lines.slice(0, 3).join(" "));
}

function renderContactLine(contact: ContactInfo) {
  const parts = [contact.email, contact.phone, contact.website, contact.location]
    .filter(Boolean)
    .map((part) => escapeHtml(part as string));

  return parts.join(" • ");
}

function extractBlocks(optimizedResumeText: string, structuredCv?: StructuredCv) {
  const structured = structuredCv
    ? {
        summaryLines: structuredCv.summary ? [structuredCv.summary] : [],
        experience: (structuredCv.experiences ?? []).map((entry) => ({
          title: entry.title,
          company: entry.company,
          date: entry.date,
          bullets: (entry.bullets ?? []).slice(0, 4),
        })),
        educationLines: structuredCv.education ?? [],
        skillLines: structuredCv.skills ?? [],
        languageLines: structuredCv.languages ?? [],
        additionalLines: structuredCv.additional ?? [],
      }
    : toStructuredCvData(optimizedResumeText);

  return {
    summary: renderSummary(structured.summaryLines),
    experienceBlock: renderExperienceBlock(structured.experience),
    educationBlock: renderEducationBlock(structured.educationLines),
    skillsBlock: renderSkillsBlock(structured.skillLines),
    languagesBlock: renderSkillsBlock(structured.languageLines),
    additionalBlock: renderAdditionalBlock(structured.additionalLines),
  };
}

function buildTemplate(choice: TemplateChoice) {
  const templates: Record<TemplateChoice, string> = {
    "Executive Classic": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{
  font-family:'Inter',sans-serif;
  margin:50px;
  color:#1f2937;
}
.header{
  margin-bottom:25px;
}
.name{
  font-size:32px;
  font-weight:700;
  letter-spacing:0.5px;
}
.contact{
  font-size:11px;
  color:#6b7280;
  margin-top:4px;
}
.section{
  margin-top:28px;
}
.section-title{
  font-size:13px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:1px;
  color:#111827;
  margin-bottom:10px;
}
.job{
  margin-bottom:16px;
}
.job-header{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  font-size:12px;
  font-weight:600;
}
.job-info{
  display:flex;
  flex-direction:column;
}
.company{
  font-size:11px;
  font-weight:500;
  color:#374151;
}
.job-date{
  font-size:10px;
  color:#6b7280;
}
ul{
  margin:6px 0 0 18px;
  font-size:11px;
  line-height:1.45;
}
</style>
</head>
<body>
<div class="header">
<div class="name">{{FULL_NAME}}</div>
<div class="contact">{{CONTACT_LINE}}</div>
</div>

<div class="section">
<div class="section-title">Professional Experience</div>
{{EXPERIENCE_BLOCK}}
</div>

<div class="section">
<div class="section-title">Education</div>
{{EDUCATION_BLOCK}}
</div>

<div class="section">
<div class="section-title">Skills</div>
{{SKILLS_BLOCK}}
</div>

<div class="section">
<div class="section-title">Languages</div>
{{LANGUAGES_BLOCK}}
</div>

{{ADDITIONAL_SECTION}}

</body>
</html>`,
    "Modern Sidebar": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:Inter;margin:0;}
.wrapper{display:flex;max-width:850px;margin:auto;}
.sidebar{
  width:32%;
  background:#111827;
  color:white;
  padding:40px 25px;
}
.sidebar .name{
  font-size:26px;
  font-weight:700;
}
.sidebar p{
  font-size:11px;
  margin-top:6px;
  color:#d1d5db;
}
.sidebar h3{
  font-size:12px;
  margin-top:25px;
  text-transform:uppercase;
  letter-spacing:1px;
}
.main{
  width:68%;
  padding:45px 40px;
}
.section-title{
  font-size:13px;
  font-weight:700;
  text-transform:uppercase;
  margin-bottom:12px;
}
.job{
  margin-bottom:16px;
}
.job-header{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  font-size:12px;
  font-weight:600;
}
.job-info{
  display:flex;
  flex-direction:column;
}
.company{
  font-size:11px;
  font-weight:500;
  color:#d1d5db;
}
.job-date{
  font-size:10px;
  color:#6b7280;
}
ul{
  font-size:11px;
  line-height:1.4;
  margin-left:18px;
}
</style>
</head>
<body>
<div class="wrapper">
<div class="sidebar">
<div class="name">{{FULL_NAME}}</div>
<p>{{CONTACT_LINE}}</p>
<h3>Skills</h3>
{{SKILLS_BLOCK}}
</div>
<div class="main">
<h3 class="section-title">Experience</h3>
{{EXPERIENCE_BLOCK}}
<h3 class="section-title">Education</h3>
{{EDUCATION_BLOCK}}

<h3 class="section-title">Languages</h3>
{{LANGUAGES_BLOCK}}

{{ADDITIONAL_SECTION}}
</div>
</div>
</body>
</html>`,
    "Minimal ATS": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{
  font-family:Arial;
  margin:40px;
  color:#000;
}
h1{
  font-size:28px;
  margin-bottom:6px;
}
.contact{
  font-size:11px;
  margin-bottom:20px;
}
h2{
  font-size:12px;
  font-weight:700;
  margin-top:20px;
  border-bottom:1px solid #000;
  padding-bottom:4px;
}
.job-header{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  font-size:11px;
  font-weight:600;
}
.job-info{
  display:flex;
  flex-direction:column;
}
.company{
  font-size:11px;
  font-weight:500;
}
.job-date{
  font-size:10px;
}
ul{
  font-size:10.8px;
  line-height:1.4;
  margin-left:18px;
}
</style>
</head>
<body>
<h1>{{FULL_NAME}}</h1>
<p class="contact">{{CONTACT_LINE}}</p>

<h2>Professional Summary</h2>
<p>{{SUMMARY}}</p>

<h2>Experience</h2>
{{EXPERIENCE_BLOCK}}

<h2>Education</h2>
{{EDUCATION_BLOCK}}

<h2>Skills</h2>
{{SKILLS_BLOCK}}

<h2>Languages</h2>
{{LANGUAGES_BLOCK}}

{{ADDITIONAL_SECTION}}
</body>
</html>`,
    "Executive Grey": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:Inter;margin:0;color:#111;}
.top{
  background:#f3f4f6;
  padding:35px 50px;
}
.name{
  font-size:30px;
  font-weight:700;
}
.contact{
  font-size:11px;
  margin-top:6px;
  color:#4b5563;
}
.content{
  padding:40px 50px;
}
.section-title{
  font-size:13px;
  text-transform:uppercase;
  font-weight:700;
  margin-top:25px;
}
.job{
  margin-bottom:16px;
}
.job-header{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  font-size:12px;
  font-weight:600;
}
.job-info{
  display:flex;
  flex-direction:column;
}
.company{
  font-size:11px;
  font-weight:500;
  color:#374151;
}
.job-date{
  font-size:10px;
  color:#6b7280;
}
ul{
  font-size:11px;
  margin-left:18px;
  line-height:1.45;
}
</style>
</head>
<body>
<div class="top">
<div class="name">{{FULL_NAME}}</div>
<div class="contact">{{CONTACT_LINE}}</div>
</div>

<div class="content">
<div class="section-title">Experience</div>
{{EXPERIENCE_BLOCK}}

<div class="section-title">Education</div>
{{EDUCATION_BLOCK}}

<div class="section-title">Skills</div>
{{SKILLS_BLOCK}}

<div class="section-title">Languages</div>
{{LANGUAGES_BLOCK}}

{{ADDITIONAL_SECTION}}
</div>
</body>
</html>`,
    "Modern Accent": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{
  font-family:Inter;
  margin:45px;
  color:#1e293b;
}
.name{
  font-size:32px;
  font-weight:700;
}
.line{
  height:4px;
  width:60px;
  background:#0f172a;
  margin:10px 0 20px 0;
}
.contact{
  font-size:11px;
  color:#475569;
}
.section-title{
  font-size:13px;
  font-weight:700;
  margin-top:25px;
  text-transform:uppercase;
}
.job{
  margin-bottom:16px;
}
.job-header{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  font-size:12px;
  font-weight:600;
}
.job-info{
  display:flex;
  flex-direction:column;
}
.company{
  font-size:11px;
  font-weight:500;
  color:#475569;
}
.job-date{
  font-size:10px;
  color:#6b7280;
}
ul{
  font-size:11px;
  margin-left:18px;
  line-height:1.45;
}
</style>
</head>
<body>
<div class="name">{{FULL_NAME}}</div>
<div class="contact">{{CONTACT_LINE}}</div>
<div class="line"></div>

<div class="section-title">Experience</div>
{{EXPERIENCE_BLOCK}}

<div class="section-title">Education</div>
{{EDUCATION_BLOCK}}

<div class="section-title">Skills</div>
{{SKILLS_BLOCK}}

<div class="section-title">Languages</div>
{{LANGUAGES_BLOCK}}

{{ADDITIONAL_SECTION}}
</body>
</html>`,
  };

  return templates[choice];
}

function withPrintReliability(html: string) {
  const printStyle = `<style>
@page { size: A4; margin: 10mm; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.job, .section, .header, .top, .content, .sidebar, .main { break-inside: avoid; page-break-inside: avoid; }
ul { margin-top: 6px; margin-bottom: 0; }
li { margin: 0; }
@media print {
  .wrapper { max-width: 190mm; margin: 0 auto; }
}
</style>`;

  return html.replace("</head>", `${printStyle}</head>`);
}

export function buildIntelligentResumeHtml(args: BuildArgs): BuildResult {
  const templateChoice = normalizeTemplateChoice(args.templateChoice);
  const template = buildTemplate(templateChoice);
  const blocks = extractBlocks(args.optimizedResumeText, args.structuredCv);
  const contact = extractContact(args.originalResumeText);
  const additionalSection = blocks.additionalBlock
    ? `<div class="section-title">Additional</div>${blocks.additionalBlock}`
    : "";
  const summarySection = blocks.summary
    ? `<h2>Professional Summary</h2>
<p>${blocks.summary}</p>`
    : "";

  const hydrated = template
    .replaceAll("{{FULL_NAME}}", escapeHtml(args.title))
    .replaceAll("{{CONTACT_LINE}}", renderContactLine(contact))
    .replaceAll("{{SUMMARY}}", blocks.summary)
    .replaceAll("<h2>Professional Summary</h2>\n<p>{{SUMMARY}}</p>", summarySection)
    .replaceAll("<h2>Professional Summary</h2>\r\n<p>{{SUMMARY}}</p>", summarySection)
    .replaceAll("{{EXPERIENCE_BLOCK}}", blocks.experienceBlock)
    .replaceAll("{{EDUCATION_BLOCK}}", blocks.educationBlock)
    .replaceAll("{{SKILLS_BLOCK}}", blocks.skillsBlock)
    .replaceAll("{{LANGUAGES_BLOCK}}", blocks.languagesBlock)
    .replaceAll("{{ADDITIONAL_SECTION}}", additionalSection);

  return {
    html: withPrintReliability(hydrated),
    metadata: { templateChoice },
    variant: templateChoice,
  };
}
