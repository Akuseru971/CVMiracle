import { renderIntelligentPdf } from "@/lib/pdf-renderer";

type TemplateChoice = "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";

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
