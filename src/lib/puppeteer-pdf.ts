import { renderIntelligentPdf } from "@/lib/pdf-renderer";
import type { TemplateChoice } from "@/lib/template-options";

type RenderArgs = {
  title: string;
  originalResumeText: string;
  optimizedResumeText: string;
  templateChoice: TemplateChoice;
  matchScore?: number;
  keywords?: string[];
};

export async function renderResumePdfWithPuppeteer(args: RenderArgs) {
  const rendered = await renderIntelligentPdf(args);
  return rendered.buffer;
}
