import type { StructuredCv } from "@/lib/cv-structure";

export type HybridPersonalInfo = {
  fullName: string;
  city: string;
  phone: string;
  email: string;
  linkedin: string;
};

export type HybridExperience = {
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string[];
};

export type HybridEducation = {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
};

export type HybridLanguage = {
  language: string;
  level: string;
};

export type HybridCvForm = {
  personalInfo: HybridPersonalInfo;
  summary: string;
  experience: HybridExperience[];
  education: HybridEducation[];
  hardSkills: string[];
  softSkills: string[];
  languages: HybridLanguage[];
  certifications: string[];
  volunteering: string[];
  interests: string[];
};

export type HybridConfidence = {
  personalInfo: number;
  summary: number;
  experience: number;
  education: number;
  hardSkills: number;
  softSkills: number;
  languages: number;
  certifications: number;
  volunteering: number;
  interests: number;
  global: number;
};

function dedupe(values: string[]) {
  return values.filter(
    (value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index,
  );
}

function normalizeDate(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toNumberScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseDateToken(value: string) {
  const clean = value.trim().toLowerCase();
  if (!clean) return Number.NEGATIVE_INFINITY;
  if (/present|current|now|aujourd'hui/.test(clean)) return Number.POSITIVE_INFINITY;
  const year = clean.match(/(19|20)\d{2}/)?.[0];
  const month = clean.match(/(^|\s)(0?[1-9]|1[0-2])([\/.-]|\s|$)/)?.[2];
  if (!year) return Number.NEGATIVE_INFINITY;
  const monthValue = month ? Number(month) : 1;
  return Number(year) * 100 + monthValue;
}

export function createEmptyHybridCvForm(): HybridCvForm {
  return {
    personalInfo: {
      fullName: "",
      city: "",
      phone: "",
      email: "",
      linkedin: "",
    },
    summary: "",
    experience: [
      {
        jobTitle: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        achievements: [],
      },
    ],
    education: [],
    hardSkills: [],
    softSkills: [],
    languages: [],
    certifications: [],
    volunteering: [],
    interests: [],
  };
}

export function sanitizeHybridCvForm(input: HybridCvForm): HybridCvForm {
  return {
    personalInfo: {
      fullName: input.personalInfo?.fullName?.trim() ?? "",
      city: input.personalInfo?.city?.trim() ?? "",
      phone: input.personalInfo?.phone?.trim() ?? "",
      email: input.personalInfo?.email?.trim() ?? "",
      linkedin: input.personalInfo?.linkedin?.trim() ?? "",
    },
    summary: input.summary?.trim() ?? "",
    experience: (input.experience ?? [])
      .map((item) => ({
        jobTitle: item.jobTitle?.trim() ?? "",
        company: item.company?.trim() ?? "",
        location: item.location?.trim() ?? "",
        startDate: normalizeDate(item.startDate ?? ""),
        endDate: normalizeDate(item.endDate ?? ""),
        isCurrent: Boolean(item.isCurrent),
        achievements: (item.achievements ?? []).map((line) => line.trim()).filter(Boolean).slice(0, 6),
      }))
      .filter((item) => item.jobTitle || item.company || item.startDate || item.endDate || item.achievements.length),
    education: (input.education ?? [])
      .map((item) => ({
        degree: item.degree?.trim() ?? "",
        institution: item.institution?.trim() ?? "",
        location: item.location?.trim() ?? "",
        startDate: normalizeDate(item.startDate ?? ""),
        endDate: normalizeDate(item.endDate ?? ""),
      }))
      .filter((item) => item.degree || item.institution),
    hardSkills: dedupe((input.hardSkills ?? []).map((item) => item.trim()).filter(Boolean)).slice(0, 30),
    softSkills: dedupe((input.softSkills ?? []).map((item) => item.trim()).filter(Boolean)).slice(0, 30),
    languages: (input.languages ?? [])
      .map((item) => ({
        language: item.language?.trim() ?? "",
        level: item.level?.trim() ?? "",
      }))
      .filter((item) => item.language),
    certifications: dedupe((input.certifications ?? []).map((item) => item.trim()).filter(Boolean)).slice(0, 20),
    volunteering: dedupe((input.volunteering ?? []).map((item) => item.trim()).filter(Boolean)).slice(0, 20),
    interests: dedupe((input.interests ?? []).map((item) => item.trim()).filter(Boolean)).slice(0, 20),
  };
}

export function sortExperiencesMostRecent(experiences: HybridExperience[]) {
  return [...experiences].sort((a, b) => {
    const aEnd = a.isCurrent ? Number.POSITIVE_INFINITY : parseDateToken(a.endDate || a.startDate);
    const bEnd = b.isCurrent ? Number.POSITIVE_INFINITY : parseDateToken(b.endDate || b.startDate);
    return bEnd - aEnd;
  });
}

export function detectDateOverlaps(experiences: HybridExperience[]) {
  const normalized = experiences
    .map((item) => {
      const start = parseDateToken(item.startDate);
      const end = item.isCurrent ? Number.POSITIVE_INFINITY : parseDateToken(item.endDate || item.startDate);
      return {
        label: `${item.jobTitle || "Poste"} @ ${item.company || "Entreprise"}`,
        start,
        end,
      };
    })
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end));

  const overlaps: string[] = [];
  for (let index = 0; index < normalized.length; index += 1) {
    for (let cursor = index + 1; cursor < normalized.length; cursor += 1) {
      const left = normalized[index];
      const right = normalized[cursor];
      const intersects = left.start <= right.end && right.start <= left.end;
      if (intersects) {
        overlaps.push(`${left.label} ↔ ${right.label}`);
      }
    }
  }

  return overlaps;
}

export function getHybridFormValidationIssues(input: HybridCvForm) {
  const safe = sanitizeHybridCvForm(input);
  const issues: string[] = [];

  if (!safe.experience.length) {
    issues.push("Ajoute au moins une expérience.");
  }

  safe.experience.forEach((item, index) => {
    const rank = index + 1;
    if (!item.jobTitle) issues.push(`Expérience ${rank}: Nom du poste manquant.`);
    if (!item.company) issues.push(`Expérience ${rank}: Entreprise manquante.`);
    if (!item.location) issues.push(`Expérience ${rank}: Lieu manquant.`);
    if (!item.startDate && !item.endDate) issues.push(`Expérience ${rank}: Dates manquantes.`);
    if (!item.achievements.length) issues.push(`Expérience ${rank}: Missions manquantes.`);
  });

  return issues;
}

export function computeHybridConfidence(input: HybridCvForm): HybridConfidence {
  const safe = sanitizeHybridCvForm(input);

  const personalFields = [
    safe.personalInfo.fullName,
    safe.personalInfo.city,
    safe.personalInfo.phone,
    safe.personalInfo.email,
    safe.personalInfo.linkedin,
  ];

  const personalInfo = toNumberScore((personalFields.filter(Boolean).length / personalFields.length) * 100);
  const summary = toNumberScore(safe.summary ? 100 : 20);

  const experienceScores = safe.experience.map((item) => {
    const required = [item.jobTitle, item.company, item.location, item.startDate || item.endDate];
    const base = required.filter(Boolean).length / required.length;
    const missionBoost = item.achievements.length > 0 ? 0.2 : 0;
    return Math.min(1, base + missionBoost) * 100;
  });

  const experience = toNumberScore(
    experienceScores.length ? experienceScores.reduce((sum, value) => sum + value, 0) / experienceScores.length : 20,
  );

  const education = toNumberScore(safe.education.length ? 85 : 35);
  const hardSkills = toNumberScore(safe.hardSkills.length ? Math.min(100, 35 + safe.hardSkills.length * 7) : 25);
  const softSkills = toNumberScore(safe.softSkills.length ? Math.min(100, 35 + safe.softSkills.length * 7) : 25);
  const languages = toNumberScore(safe.languages.length ? 80 : 30);
  const certifications = toNumberScore(safe.certifications.length ? 80 : 30);
  const volunteering = toNumberScore(safe.volunteering.length ? 75 : 25);
  const interests = toNumberScore(safe.interests.length ? 70 : 20);

  const global = toNumberScore(
    [
      personalInfo,
      summary,
      experience,
      education,
      hardSkills,
      softSkills,
      languages,
      certifications,
      volunteering,
      interests,
    ].reduce((sum, value) => sum + value, 0) / 10,
  );

  return {
    personalInfo,
    summary,
    experience,
    education,
    hardSkills,
    softSkills,
    languages,
    certifications,
    volunteering,
    interests,
    global,
  };
}

export function mapStructuredToHybrid(structured: StructuredCv): HybridCvForm {
  const safe = {
    summary: structured.summary ?? "",
    experiences: structured.experiences ?? [],
    education: structured.education ?? [],
    skills: structured.skills ?? [],
    languages: structured.languages ?? [],
    additional: structured.additional ?? [],
  };

  return sanitizeHybridCvForm({
    personalInfo: {
      fullName: "",
      city: "",
      phone: "",
      email: "",
      linkedin: "",
    },
    summary: safe.summary,
    experience: safe.experiences.map((item) => {
      const [startDate = "", endDate = ""] = item.date.split(/[-–—]/).map((part) => part.trim());
      return {
        jobTitle: item.title,
        company: item.company,
        location: item.location ?? "",
        startDate,
        endDate,
        isCurrent: /present|current|now|aujourd'hui/i.test(item.date),
        achievements: item.bullets,
      };
    }),
    education: safe.education.map((line) => ({
      degree: line,
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
    })),
    hardSkills: safe.skills,
    softSkills: [],
    languages: safe.languages.map((line) => ({ language: line, level: "" })),
    certifications: safe.additional,
    volunteering: [],
    interests: [],
  });
}

export function mapHybridToStructured(input: HybridCvForm): StructuredCv {
  const safe = sanitizeHybridCvForm(input);

  const experiences = sortExperiencesMostRecent(safe.experience).map((item) => ({
    title: item.jobTitle,
    company: item.company,
    location: item.location,
    date: item.isCurrent
      ? `${item.startDate || ""} - Present`.trim()
      : `${item.startDate || ""}${item.endDate ? ` - ${item.endDate}` : ""}`.trim(),
    bullets: item.achievements.slice(0, 4),
  }));

  const education = safe.education.map((item) =>
    [item.degree, item.institution, item.location].filter(Boolean).join(" — "),
  );

  const languages = safe.languages.map((item) =>
    [item.language, item.level].filter(Boolean).join(" — "),
  );

  return {
    summary: safe.summary,
    experiences,
    education,
    skills: dedupe([...safe.hardSkills, ...safe.softSkills]).slice(0, 24),
    languages,
    additional: dedupe([...safe.certifications, ...safe.volunteering, ...safe.interests]).slice(0, 20),
  };
}
