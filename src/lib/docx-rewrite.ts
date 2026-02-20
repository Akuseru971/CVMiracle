import JSZip from "jszip";

type Replacement = {
  from: string;
  to: string;
};

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function applyReplacements(xml: string, replacements: Replacement[]) {
  let output = xml;

  for (const replacement of replacements) {
    const from = replacement.from?.trim();
    const to = replacement.to?.trim();
    if (!from || !to || from === to) continue;

    output = output.split(xmlEscape(from)).join(xmlEscape(to));
    output = output.split(from).join(to);
  }

  return output;
}

export async function rewriteDocxWithReplacements(
  docxBuffer: Buffer,
  replacements: Replacement[],
) {
  const zip = await JSZip.loadAsync(docxBuffer);

  const candidateFiles = [
    "word/document.xml",
    ...Object.keys(zip.files).filter((path) => path.startsWith("word/header") && path.endsWith(".xml")),
    ...Object.keys(zip.files).filter((path) => path.startsWith("word/footer") && path.endsWith(".xml")),
  ];

  for (const filePath of candidateFiles) {
    const file = zip.file(filePath);
    if (!file) continue;
    const xml = await file.async("string");
    const rewritten = applyReplacements(xml, replacements);
    zip.file(filePath, rewritten);
  }

  const generated = await zip.generateAsync({ type: "nodebuffer" });
  return Buffer.from(generated);
}
