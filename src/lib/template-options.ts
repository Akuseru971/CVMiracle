export const TEMPLATE_CHOICES = [
  "Executive Classic",
  "Modern Sidebar",
  "Minimal ATS",
  "Executive Grey",
  "Modern Accent",
] as const;

export type TemplateChoice = (typeof TEMPLATE_CHOICES)[number];

export function normalizeTemplateChoice(value: string): TemplateChoice {
  if (TEMPLATE_CHOICES.includes(value as TemplateChoice)) {
    return value as TemplateChoice;
  }

  if (value === "Original Design Enhanced") return "Executive Classic";
  if (value === "Modern Executive") return "Modern Sidebar";
  if (value === "Minimal ATS") return "Minimal ATS";

  return "Executive Classic";
}
