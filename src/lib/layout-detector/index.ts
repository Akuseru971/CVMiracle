import { createHash } from "crypto";

export type LayoutType =
  | "single-column"
  | "two-column-left"
  | "two-column-right"
  | "multi-block-asymmetric";

export type SpacingProfile = "compact" | "balanced" | "airy";
export type HierarchyStyle = "minimal" | "classic" | "executive";

export type VisualElementsDetected = {
  separators: boolean;
  backgroundBlocks: boolean;
  dateAlignment: boolean;
  iconLikeBullets: boolean;
  contactHeader: boolean;
};

export type LayoutMetadata = {
  layoutType: LayoutType;
  columnCount: 1 | 2;
  sidebarPosition: "left" | "right" | "none";
  sidebarWidthRatio: number;
  primaryColor: string;
  accentColor: string;
  spacingProfile: SpacingProfile;
  hierarchyStyle: HierarchyStyle;
  densityProfile: "compact" | "balanced" | "airy";
  visualElementsDetected: VisualElementsDetected;
};

type DetectionInput = {
  originalText: string;
  requestedTemplate?: "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";
};

const cache = new Map<string, LayoutMetadata>();

const SIDEBAR_MARKERS = [
  "skills",
  "compétences",
  "languages",
  "langues",
  "certifications",
  "interests",
  "outils",
  "stack",
];

const SECTION_MARKERS = [
  "experience",
  "expérience",
  "education",
  "formation",
  "projects",
  "projets",
  "summary",
  "profil",
];

function hashKey(input: DetectionInput) {
  return createHash("sha1")
    .update(`${input.requestedTemplate ?? "none"}|${input.originalText.slice(0, 10000)}`)
    .digest("hex");
}

function detectSpacingProfile(lines: string[]): SpacingProfile {
  const emptyRuns = lines.filter((l) => l.trim().length === 0).length;
  const ratio = emptyRuns / Math.max(1, lines.length);
  if (ratio > 0.22) return "airy";
  if (ratio < 0.1) return "compact";
  return "balanced";
}

function detectHierarchyStyle(text: string, requestedTemplate?: DetectionInput["requestedTemplate"]): HierarchyStyle {
  if (requestedTemplate === "Modern Executive") return "executive";
  if (requestedTemplate === "Minimal ATS") return "minimal";

  const hasManyUpperHeadings = (text.match(/\n[A-Z\s]{4,}\n/g) ?? []).length >= 3;
  if (hasManyUpperHeadings) return "classic";
  return "executive";
}

function detectColumns(text: string, lines: string[]) {
  const lower = text.toLowerCase();
  const sidebarHits = SIDEBAR_MARKERS.filter((m) => lower.includes(m)).length;
  const sectionHits = SECTION_MARKERS.filter((m) => lower.includes(m)).length;

  const denseShortLines = lines.filter((l) => {
    const clean = l.trim();
    return clean.length > 0 && clean.length < 28;
  }).length;

  const shortRatio = denseShortLines / Math.max(1, lines.length);

  const twoColumnLikely = sidebarHits >= 2 && sectionHits >= 3 && shortRatio > 0.22;

  if (!twoColumnLikely) {
    return {
      layoutType: "single-column" as const,
      columnCount: 1 as const,
      sidebarPosition: "none" as const,
      sidebarWidthRatio: 0,
    };
  }

  const leftBias = /skills|compétences|langues|languages/.test(lower);

  return {
    layoutType: leftBias ? ("two-column-left" as const) : ("two-column-right" as const),
    columnCount: 2 as const,
    sidebarPosition: leftBias ? ("left" as const) : ("right" as const),
    sidebarWidthRatio: 0.31,
  };
}

function detectVisualElements(text: string): VisualElementsDetected {
  const hasSeparators = /[-_=]{3,}/.test(text);
  const hasDatePatterns = /(19|20)\d{2}\s*[-–]\s*((19|20)\d{2}|present|current|aujourd'hui)/i.test(text);
  const hasIconBullets = /[•▪◦]/.test(text);
  const hasContactHeader = /@|linkedin|github|\+\d|\bfrance\b|\bremote\b/i.test(text);

  return {
    separators: hasSeparators,
    backgroundBlocks: false,
    dateAlignment: hasDatePatterns,
    iconLikeBullets: hasIconBullets,
    contactHeader: hasContactHeader,
  };
}

function inferColors(requestedTemplate?: DetectionInput["requestedTemplate"]) {
  if (requestedTemplate === "Modern Executive") {
    return { primaryColor: "#0f172a", accentColor: "#2563eb" };
  }
  if (requestedTemplate === "Minimal ATS") {
    return { primaryColor: "#111827", accentColor: "#334155" };
  }
  return { primaryColor: "#0f172a", accentColor: "#0ea5e9" };
}

export function detectLayoutMetadata(input: DetectionInput): LayoutMetadata {
  const key = hashKey(input);
  const cached = cache.get(key);
  if (cached) return cached;

  const lines = input.originalText.split("\n");
  const spacingProfile = detectSpacingProfile(lines);
  const columnInference = detectColumns(input.originalText, lines);
  const hierarchyStyle = detectHierarchyStyle(input.originalText, input.requestedTemplate);
  const colors = inferColors(input.requestedTemplate);

  const metadata: LayoutMetadata = {
    ...columnInference,
    ...colors,
    spacingProfile,
    hierarchyStyle,
    densityProfile: spacingProfile,
    visualElementsDetected: detectVisualElements(input.originalText),
  };

  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(key, metadata);
  return metadata;
}
