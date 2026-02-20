import { normalizeTemplateChoice, type TemplateChoice } from "@/lib/template-options";

type BuildArgs = {
  title: string;
  originalResumeText: string;
  optimizedResumeText: string;
  templateChoice: string;
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
  if (/^professional summary|summary|profil|profile|résumé|resume$/i.test(clean)) return "Summary";
  if (/^work experience|experience|expérience|expériences$/i.test(clean)) return "Experience";
  if (/^education|formation|formations$/i.test(clean)) return "Education";
  if (/^skills|compétences|competences$/i.test(clean)) return "Skills";
  if (/^projects?|projets?$/i.test(clean)) return "Projects";
  if (/^languages?|langues?$/i.test(clean)) return "Languages";
  if (/^certifications?|certificats?$/i.test(clean)) return "Certifications";
  return clean;
}

function looksHeading(line: string) {
  const clean = line.replace(/:$/, "").trim();
  if (!clean || clean.length > 42) return false;
  return /^(Summary|Experience|Education|Skills|Projects|Languages|Certifications)$/i.test(normalizeHeading(clean));
}

function parseSections(text: string): ResumeSection[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
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
  const entries: Array<{ title: string; date?: string; bullets: string[] }> = [];
  let current: { title: string; date?: string; bullets: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const isBullet = /^[•▪◦-]\s*/.test(rawLine);
    if (!isBullet) {
      if (current) entries.push(current);
      const date = line.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Aujourd'hui))/i)?.[0];
      const clean = date ? line.replace(date, "").replace(/[|·•-]\s*$/, "").trim() : line;
      current = { title: clean, date, bullets: [] };
      continue;
    }

    if (!current) {
      current = { title: line.replace(/^[-•▪◦]\s*/, ""), bullets: [] };
      continue;
    }

    current.bullets.push(line.replace(/^[-•▪◦]\s*/, ""));
  }

  if (current) entries.push(current);
  return entries;
}

function renderExperienceBlock(lines: string[]) {
  const entries = parseExperience(lines);

  return entries
    .map((entry) => {
      const bullets = entry.bullets
        .slice(0, 4)
        .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
        .join("\n");

      return `<div class="job">
  <div class="job-title">${escapeHtml(entry.title)}${entry.date ? `<span class="job-date">${escapeHtml(entry.date)}</span>` : ""}</div>
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

function renderSummary(lines: string[]) {
  return escapeHtml(lines.slice(0, 3).join(" "));
}

function renderContactLine(contact: ContactInfo) {
  const parts = [contact.email, contact.phone, contact.website, contact.location]
    .filter(Boolean)
    .map((part) => escapeHtml(part as string));

  return parts.join(" • ");
}

function extractBlocks(optimizedResumeText: string) {
  const sections = parseSections(optimizedResumeText);
  const getLines = (name: string) => sections.find((section) => section.heading === name)?.lines ?? [];

  const summaryLines = getLines("Summary");
  const experienceLines = getLines("Experience");
  const educationLines = getLines("Education");
  const skillsLines = getLines("Skills").concat(getLines("Languages")).concat(getLines("Certifications"));

  return {
    summary: renderSummary(summaryLines),
    experienceBlock: renderExperienceBlock(experienceLines),
    educationBlock: renderEducationBlock(educationLines),
    skillsBlock: renderSkillsBlock(skillsLines),
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
  font-family: 'Inter', Arial, sans-serif;
  margin:0;
  padding:40px;
  color:#1a1a1a;
}
.container{
  max-width:800px;
  margin:auto;
}
.header{
  border-bottom:2px solid #0f172a;
  padding-bottom:10px;
}
.name{
  font-size:26px;
  font-weight:700;
  color:#0f172a;
}
.contact{
  font-size:11px;
  margin-top:5px;
}
.section{
  margin-top:20px;
}
.section-title{
  font-size:13px;
  font-weight:700;
  color:#0f172a;
  margin-bottom:8px;
  text-transform:uppercase;
}
.job{
  margin-bottom:12px;
}
.job-title{
  font-weight:600;
}
.job-date{
  float:right;
  font-size:11px;
}
ul{
  margin:5px 0 0 18px;
  font-size:11px;
  line-height:1.4;
}
</style>
</head>
<body>
<div class="container">
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

</div>
</body>
</html>`,
    "Modern Sidebar": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:Inter,sans-serif;margin:0;}
.wrapper{display:flex;max-width:800px;margin:auto;}
.sidebar{
  width:30%;
  background:#1e3a8a;
  color:white;
  padding:30px;
}
.main{
  width:70%;
  padding:30px;
}
.name{font-size:22px;font-weight:700;}
.section-title{
  font-size:12px;
  font-weight:700;
  text-transform:uppercase;
  margin-top:20px;
}
ul{font-size:11px;line-height:1.4;margin-left:18px;}
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
</div>
</div>
</body>
</html>`,
    "Minimal ATS": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:Arial;margin:30px;color:#000;}
h1{font-size:20px;margin-bottom:5px;}
h2{font-size:12px;margin-top:15px;border-bottom:1px solid #000;}
p,li{font-size:11px;line-height:1.3;}
ul{margin-left:18px;}
</style>
</head>
<body>
<h1>{{FULL_NAME}}</h1>
<p>{{CONTACT_LINE}}</p>

<h2>Professional Summary</h2>
<p>{{SUMMARY}}</p>

<h2>Experience</h2>
{{EXPERIENCE_BLOCK}}

<h2>Education</h2>
{{EDUCATION_BLOCK}}

<h2>Skills</h2>
{{SKILLS_BLOCK}}
</body>
</html>`,
    "Executive Grey": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:Inter;margin:0;}
.header{
  background:#e5e7eb;
  padding:25px;
}
.name{font-size:24px;font-weight:700;}
.section{padding:30px;}
.section-title{
  font-size:13px;
  font-weight:700;
  margin-bottom:8px;
}
ul{font-size:11px;margin-left:18px;}
</style>
</head>
<body>
<div class="header">
<div class="name">{{FULL_NAME}}</div>
<div>{{CONTACT_LINE}}</div>
</div>

<div class="section">
<div class="section-title">Experience</div>
{{EXPERIENCE_BLOCK}}

<div class="section-title">Education</div>
{{EDUCATION_BLOCK}}

<div class="section-title">Skills</div>
{{SKILLS_BLOCK}}
</div>
</body>
</html>`,
    "Modern Accent": `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{font-family:Inter;margin:40px;color:#111;}
.name{font-size:26px;font-weight:700;}
.line{height:4px;background:#2563eb;margin:10px 0 20px;}
.section-title{
  font-size:13px;
  font-weight:700;
  margin-top:20px;
}
ul{font-size:11px;line-height:1.4;margin-left:18px;}
</style>
</head>
<body>
<div class="name">{{FULL_NAME}}</div>
<div>{{CONTACT_LINE}}</div>
<div class="line"></div>

<div class="section-title">Experience</div>
{{EXPERIENCE_BLOCK}}

<div class="section-title">Education</div>
{{EDUCATION_BLOCK}}

<div class="section-title">Skills</div>
{{SKILLS_BLOCK}}
</body>
</html>`,
  };

  return templates[choice];
}

export function buildIntelligentResumeHtml(args: BuildArgs): BuildResult {
  const templateChoice = normalizeTemplateChoice(args.templateChoice);
  const template = buildTemplate(templateChoice);
  const blocks = extractBlocks(args.optimizedResumeText);
  const contact = extractContact(args.originalResumeText);

  const hydrated = template
    .replaceAll("{{FULL_NAME}}", escapeHtml(args.title))
    .replaceAll("{{CONTACT_LINE}}", renderContactLine(contact))
    .replaceAll("{{SUMMARY}}", blocks.summary)
    .replaceAll("{{EXPERIENCE_BLOCK}}", blocks.experienceBlock)
    .replaceAll("{{EDUCATION_BLOCK}}", blocks.educationBlock)
    .replaceAll("{{SKILLS_BLOCK}}", blocks.skillsBlock);

  return {
    html: hydrated,
    metadata: { templateChoice },
    variant: templateChoice,
  };
}
