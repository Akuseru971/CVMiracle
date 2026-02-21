export type CvExperience = {
  title: string;
  company: string;
  date: string;
  location?: string;
  bullets: string[];
};

export type StructuredCv = {
  contact: {
    fullName: string;
    email: string;
    phone: string;
  };
  summary: string;
  experiences: CvExperience[];
  education: string[];
  skills: string[];
  languages: string[];
  additional: string[];
};

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

function splitSkillLine(line: string) {
  return line
    .split(/[,|•·]/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 1);
}

function dedupe(values: string[]) {
  return values.filter(
    (value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index,
  );
}

function extractPrimaryContact(text: string) {
  const head = text.split("\n").slice(0, 14).join("\n");

  const email = head.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone =
    head.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?){3,5}\d{2,4}/)?.[0] ?? "";

  const nameCandidate = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-\s]{2,60}$/.test(line) && line.split(/\s+/).length <= 4);

  return {
    fullName: nameCandidate ?? "",
    email,
    phone,
  };
}

function parseSectionsRaw(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").trim())
    .filter(Boolean);

  const sections: Array<{ heading: string; lines: string[] }> = [];
  let current = { heading: "Summary", lines: [] as string[] };

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

function parseExperiences(rawLines: string[]) {
  const entries: CvExperience[] = [];
  let current: CvExperience | null = null;
  let pendingDate = "";

  const dateRangeRegex = /(\b(?:19|20)\d{2}\b\s*[-–—]\s*(?:\b(?:19|20)\d{2}\b|Present|Current|Aujourd'hui|Now))/i;
  const dateLikeRegex = /((?:\b(?:19|20)\d{2}\b)|(?:\b\d{1,2}[/.\-]\d{1,2}[/.\-](?:19|20)\d{2}\b)|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\w*\b)|(?:present|current|now|aujourd'hui))/i;

  const isBulletLine = (value: string) => /^[•▪◦-]\s*/.test(value);
  const looksDateLike = (value: string) => /\d/.test(value) && dateLikeRegex.test(value);
  const extractDateText = (value: string) => value.match(dateRangeRegex)?.[0] ?? value.match(dateLikeRegex)?.[0] ?? "";
  const looksCompanyLine = (value: string) => {
    if (!value || /\d/.test(value)) return false;
    if (value.length > 90) return false;
    if (/^[-•▪◦]/.test(value)) return false;
    return /\s[—–-]\s/.test(value) || /\b(?:inc|llc|sas|sa|gmbh|ltd|group|studio|company|corp|technologies)\b/i.test(value) || value.split(" ").length <= 8;
  };

  const parseHeader = (value: string, fallbackDate = "") => {
    const date = extractDateText(value) || fallbackDate;
    const withoutDate = date ? value.replace(date, "").trim() : value;
    const parts = withoutDate
      .split(/\s+[|]\s+|\s+[—–]\s+|\s+-\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      const company = parts[1] ?? "";
      const location = parts.length >= 3 ? parts.slice(2).join(" — ") : "";
      return {
        title: parts[0],
        company,
        location,
        date,
      };
    }

    return {
      title: withoutDate.replace(/[|·•-]\s*$/, "").trim(),
      company: "",
      location: "",
      date,
    };
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const isBullet = isBulletLine(rawLine);
    const hasDate = looksDateLike(line);
    const looksHeader = /\||\s[—–-]\s/.test(line) || line.length < 85;

    if (!isBullet && hasDate && !current) {
      pendingDate = extractDateText(line) || line;
      continue;
    }

    if (!isBullet && hasDate && current && !current.date) {
      current.date = extractDateText(line) || line;
      continue;
    }

    if (!isBullet && current && !current.company && !hasDate && looksCompanyLine(line)) {
      current.company = line;
      continue;
    }

    if (!isBullet && looksHeader) {
      if (current) entries.push(current);
      const parsed = parseHeader(line, pendingDate);
      pendingDate = "";
      current = {
        title: parsed.title,
        company: parsed.company,
        date: parsed.date,
        location: parsed.location,
        bullets: [],
      };
      continue;
    }

    if (!current) {
      if (hasDate) {
        pendingDate = extractDateText(line) || line;
        continue;
      }
      current = {
        title: line.replace(/^[-•▪◦]\s*/, ""),
        company: "",
        date: "",
        location: "",
        bullets: [],
      };
      continue;
    }

    const cleaned = line.replace(/^[-•▪◦]\s*/, "").trim();
    if (cleaned && cleaned !== current.title && cleaned !== current.company && !looksDateLike(cleaned)) {
      current.bullets.push(cleaned);
    }
  }

  if (current) entries.push(current);

  return entries
    .filter((entry) => entry.title.length > 1 && !looksDateLike(entry.title))
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.slice(0, 4),
    }));
}

export function parseStructuredCvFromText(text: string): StructuredCv {
  const rawSections = parseSectionsRaw(text);
  const contact = extractPrimaryContact(text);

  const getLines = (...names: string[]) =>
    rawSections
      .filter((section) => names.includes(section.heading))
      .flatMap((section) => section.lines)
      .map((line) => line.replace(/^[-•▪◦]\s*/, "").trim())
      .filter(Boolean);

  const summaryLines = getLines("Summary");
  const experienceRaw = rawSections
    .filter((section) => section.heading === "Experience")
    .flatMap((section) => section.lines)
    .filter(Boolean);

  const experiences = parseExperiences(experienceRaw);

  const fallbackSummary = rawSections
    .filter((section) => section.heading !== "Experience")
    .flatMap((section) => section.lines)
    .filter((line) => line.length > 32)
    .slice(0, 3)
    .join(" ");

  const summary = summaryLines.length > 0 ? summaryLines.slice(0, 3).join(" ") : fallbackSummary;

  const education = dedupe(getLines("Education", "Projects")).slice(0, 14);
  const skills = dedupe(getLines("Skills").flatMap(splitSkillLine)).slice(0, 18);
  const languages = dedupe(getLines("Languages").flatMap(splitSkillLine)).slice(0, 10);
  const additional = dedupe(getLines("Certifications", "Projects").flatMap(splitSkillLine)).slice(0, 12);

  return {
    contact,
    summary,
    experiences,
    education,
    skills,
    languages,
    additional,
  };
}

export function sanitizeStructuredCv(input: StructuredCv): StructuredCv {
  return {
    contact: {
      fullName: input.contact?.fullName?.trim() ?? "",
      email: input.contact?.email?.trim() ?? "",
      phone: input.contact?.phone?.trim() ?? "",
    },
    summary: input.summary?.trim() ?? "",
    experiences: (input.experiences ?? [])
      .map((entry) => ({
        title: entry.title?.trim() ?? "",
        company: entry.company?.trim() ?? "",
        date: entry.date?.trim() ?? "",
        location: entry.location?.trim() ?? "",
        bullets: (entry.bullets ?? []).map((bullet) => bullet.trim()).filter(Boolean).slice(0, 4),
      }))
      .filter((entry) => entry.title.length > 0),
    education: (input.education ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 14),
    skills: (input.skills ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 18),
    languages: (input.languages ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 10),
    additional: (input.additional ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 12),
  };
}

export function structuredCvToText(input: StructuredCv) {
  const safe = sanitizeStructuredCv(input);

  const experienceText = safe.experiences
    .map((entry) => {
      const headerParts = [entry.title, entry.company, entry.location, entry.date].filter(Boolean);
      const header = headerParts.join(" | ");
      const bullets = entry.bullets.map((bullet) => `- ${bullet}`).join("\n");
      return `${header}${bullets ? `\n${bullets}` : ""}`;
    })
    .join("\n\n");

  const sections = [
    [safe.contact.fullName, safe.contact.phone, safe.contact.email].filter(Boolean).join(" | "),
    safe.summary ? `Summary\n${safe.summary}` : "",
    experienceText ? `Experience\n${experienceText}` : "",
    safe.education.length ? `Education\n${safe.education.map((item) => `- ${item}`).join("\n")}` : "",
    safe.skills.length ? `Skills\n${safe.skills.map((item) => `- ${item}`).join("\n")}` : "",
    safe.languages.length ? `Languages\n${safe.languages.map((item) => `- ${item}`).join("\n")}` : "",
    safe.additional.length ? `Additional\n${safe.additional.map((item) => `- ${item}`).join("\n")}` : "",
  ].filter(Boolean);

  return sections.join("\n\n");
}

export function getHybridValidationIssues(input: StructuredCv) {
  const safe = sanitizeStructuredCv(input);
  const issues: string[] = [];

  if (!safe.contact.fullName.trim()) {
    issues.push("Contact: Nom et prénom manquants.");
  }

  if (!safe.contact.email.trim()) {
    issues.push("Contact: Email manquant.");
  }

  if (!safe.contact.phone.trim()) {
    issues.push("Contact: Téléphone manquant.");
  }

  if (!safe.experiences.length) {
    issues.push("Ajoute au moins une expérience.");
  }

  safe.experiences.forEach((experience, index) => {
    const rank = index + 1;
    if (!experience.company.trim()) issues.push(`Expérience ${rank}: Entreprise manquante.`);
    if (!experience.title.trim()) issues.push(`Expérience ${rank}: Nom du poste manquant.`);
    if (!experience.date.trim()) issues.push(`Expérience ${rank}: Dates manquantes.`);
    if (!(experience.location ?? "").trim()) issues.push(`Expérience ${rank}: Lieu manquant.`);
    if (!experience.bullets.length) issues.push(`Expérience ${rank}: Missions manquantes.`);
  });

  return issues;
}
