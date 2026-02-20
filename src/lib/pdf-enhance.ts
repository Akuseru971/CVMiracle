import { PDFDocument, StandardFonts } from "pdf-lib";

function wrapText(text: string, maxLength: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxLength) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function buildOriginalDesignEnhancedPdf(
  originalPdfBuffer: Buffer,
  optimizedResume: string,
) {
  const originalPdf = await PDFDocument.load(originalPdfBuffer);
  const outputPdf = await PDFDocument.create();

  const copiedPages = await outputPdf.copyPages(originalPdf, originalPdf.getPageIndices());
  copiedPages.forEach((page) => outputPdf.addPage(page));

  const page = outputPdf.addPage([595, 842]);
  const font = await outputPdf.embedFont(StandardFonts.Helvetica);
  const bold = await outputPdf.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  page.drawText("Optimized Content (Original Design Enhanced)", {
    x: 40,
    y,
    size: 16,
    font: bold,
  });

  y -= 32;
  const lines = optimizedResume
    .split("\n")
    .flatMap((line) => (line.trim() ? wrapText(line.trim(), 95) : [""]));

  for (const line of lines) {
    if (y < 48) {
      const newPage = outputPdf.addPage([595, 842]);
      y = 800;
      newPage.drawText(line, { x: 40, y, size: 10.5, font });
      y -= 16;
      continue;
    }

    page.drawText(line, {
      x: 40,
      y,
      size: 10.5,
      font,
    });
    y -= 16;
  }

  return Buffer.from(await outputPdf.save());
}
