import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { buildIntelligentResumeHtml } from "@/lib/template-engine";
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

export async function renderIntelligentPdf(args: RenderArgs) {
  const { html, metadata, variant } = buildIntelligentResumeHtml(args);

  const chromiumPath = await chromium.executablePath().catch(() => "");
  const candidates = Array.from(
    new Set(
      [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROMIUM_PATH,
        chromiumPath,
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  const launchArgs = Array.from(
    new Set([
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ]),
  );

  let lastError: unknown = null;

  for (const executablePath of candidates) {
    try {
      const browser = await puppeteer.launch({
        args: launchArgs,
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
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Aucun exécutable Chromium disponible pour le rendu PDF.");
}
