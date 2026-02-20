import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export type ParsedCv = {
  text: string;
  fileType: "pdf" | "docx";
  originalName: string;
  buffer: Buffer;
};

export async function parseCvFile(file: File): Promise<ParsedCv> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf") || file.type.includes("pdf")) {
    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim();
    if (!text) {
      throw new Error("PDF illisible");
    }

    return {
      text: text.slice(0, 20000),
      fileType: "pdf",
      originalName: file.name,
      buffer,
    };
  }

  if (lowerName.endsWith(".docx") || file.type.includes("word")) {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = parsed.value?.trim();
    if (!text) {
      throw new Error("DOCX illisible");
    }

    return {
      text: text.slice(0, 20000),
      fileType: "docx",
      originalName: file.name,
      buffer,
    };
  }

  throw new Error("Format non supporté. Utilisez PDF ou DOCX.");
}

export async function extractTextFromDocxBuffer(buffer: Buffer) {
  const parsed = await mammoth.extractRawText({ buffer });
  const text = parsed.value?.trim();
  if (!text) {
    throw new Error("DOCX illisible");
  }
  return text.slice(0, 20000);
}

export async function extractCvText(file: File) {
  const parsed = await parseCvFile(file);
  return parsed.text;
}
