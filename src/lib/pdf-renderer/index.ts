import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { buildIntelligentResumeHtml } from "@/lib/template-engine";
import type { TemplateChoice } from "@/lib/template-options";

type RenderArgs = {
  title: string;
  originalResumeText: string;
  optimizedResumeText: string;
  templateChoice: TemplateChoice;
  matchScore?: number;
  keywords?: string[];
};

export async function renderIntelligentPdf(args: RenderArgs) {
  const { html, metadata, variant } = buildIntelligentResumeHtml(args);

  const executablePath =
    process.env.NODE_ENV === "production"
      ? await chromium.executablePath()
      : process.env.PUPPETEER_EXECUTABLE_PATH || (await chromium.executablePath());

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: {
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.evaluateHandle("document.fonts.ready");
    await page.emulateMediaType("print");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });

    return {
      buffer: Buffer.from(pdfBuffer),
      layoutMetadata: metadata,
      templateVariant: variant,
    };
  } finally {
    await browser.close();
  }
}
