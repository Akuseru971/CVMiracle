import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { buildResumeHtmlTemplate } from "@/lib/resume-template-html";

type TemplateChoice = "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";

type RenderArgs = {
  title: string;
  resumeText: string;
  templateChoice: TemplateChoice;
  matchScore?: number;
  keywords?: string[];
};

export async function renderResumePdfWithPuppeteer(args: RenderArgs) {
  const html = buildResumeHtmlTemplate(args);

  let executablePath: string;
  if (process.env.NODE_ENV === "production") {
    executablePath = await chromium.executablePath();
  } else {
    executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (await chromium.executablePath());
  }

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
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
