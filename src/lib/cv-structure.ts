export type CvExperience = {
  title: string;
  company: string;
  date: string;
  bullets: string[];
};

export type StructuredCv = {
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
  const dateRegex = /(\b(?:19|20)\d{2}\b\s*[-–—]\s*(?:\b(?:19|20)\d{2}\b|Present|Current|Aujourd'hui|Now))/i;

  const parseHeader = (value: string) => {
    const date = value.match(dateRegex)?.[0] ?? "";
    const withoutDate = date ? value.replace(date, "").trim() : value;
    const parts = withoutDate
      .split(/\s+[|]\s+|\s+[—–]\s+|\s+-\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return {
        title: parts[0],
        company: parts.slice(1).join(" — "),
        date,
      };
    }

    return {
      title: withoutDate.replace(/[|·•-]\s*$/, "").trim(),
      company: "",
      date,
    };
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const isBullet = /^[•▪◦-]\s*/.test(rawLine);
    const hasDate = dateRegex.test(line);
    const looksHeader = hasDate || /\||\s[—–-]\s/.test(line) || line.length < 85;

    if (!isBullet && looksHeader) {
      if (current) entries.push(current);
      const parsed = parseHeader(line);
      current = {
        title: parsed.title,
        company: parsed.company,
        date: parsed.date,
        bullets: [],
      };
      continue;
    }

    if (!current) {
      current = {
        title: line.replace(/^[-•▪◦]\s*/, ""),
        company: "",
        date: "",
        bullets: [],
      };
      continue;
    }

    const cleaned = line.replace(/^[-•▪◦]\s*/, "").trim();
    if (cleaned && cleaned !== current.title && cleaned !== current.company && !dateRegex.test(cleaned)) {
      current.bullets.push(cleaned);
    }
  }

  if (current) entries.push(current);

  return entries
    .filter((entry) => entry.title.length > 1)
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.slice(0, 4),
    }));
}

export function parseStructuredCvFromText(text: string): StructuredCv {
  const rawSections = parseSectionsRaw(text);

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
    summary: input.summary?.trim() ?? "",
    experiences: (input.experiences ?? [])
      .map((entry) => ({
        title: entry.title?.trim() ?? "",
        company: entry.company?.trim() ?? "",
        date: entry.date?.trim() ?? "",
        bullets: (entry.bullets ?? []).map((bullet) => bullet.trim()).filter(Boolean).slice(0, 4),
      }))
      .filter((entry) => entry.title.length > 0),
    education: (input.education ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 14),
    skills: (input.skills ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 18),
    languages: (input.languages ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 10),
    additional: (input.additional ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 12),
  };
}
