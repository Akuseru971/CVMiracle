import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractCvText(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf") || file.type.includes("pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = parsed.text?.trim();
    if (!text) {
      throw new Error("PDF illisible");
    }
    return text.slice(0, 20000);
  }

  if (lowerName.endsWith(".docx") || file.type.includes("word")) {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = parsed.value?.trim();
    if (!text) {
      throw new Error("DOCX illisible");
    }
    return text.slice(0, 20000);
  }

  throw new Error("Format non supporté. Utilisez PDF ou DOCX.");
}
