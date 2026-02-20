import { renderIntelligentPdf } from "@/lib/pdf-renderer";
import type { TemplateChoice } from "@/lib/template-options";
import type { StructuredCv } from "@/lib/cv-structure";

type RenderArgs = {
  title: string;
  originalResumeText: string;
  optimizedResumeText: string;
  structuredCv?: StructuredCv;
  templateChoice: TemplateChoice;
  matchScore?: number;
  keywords?: string[];
};

export async function renderResumePdfWithPuppeteer(args: RenderArgs) {
  const rendered = await renderIntelligentPdf(args);
  return rendered.buffer;
}
