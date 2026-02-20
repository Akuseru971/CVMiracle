import PDFDocument from "pdfkit";
import { normalizeTemplateChoice, type TemplateChoice } from "@/lib/template-options";

function normalizeLine(line: string) {
  return line.replace(/^[-•▪◦]\s*/, "").trim();
}

function isSectionHeading(line: string) {
  const clean = line.replace(/:$/, "").trim();
  if (!clean || clean.length > 40) return false;
  return (
    /^(Professional Summary|Summary|Profile|Profil|Work Experience|Experience|Expérience|Education|Formation|Skills|Compétences|Certifications|Projects|Projets|Languages|Langues|Interests)$/i.test(clean) ||
    (/^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][A-Za-zÀ-ÿ\s]{2,36}$/.test(clean) && !/[.,;!?]/.test(clean))
  );
}

type ParsedSection = { heading: string; lines: string[] };

type PdfFallbackOptions = {
  templateChoice?: string;
  originalResumeText?: string;
};

function parseSections(raw: string) {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: ParsedSection[] = [];
  let current: ParsedSection = { heading: "Summary", lines: [] };

  for (const line of lines) {
    if (isSectionHeading(line)) {
      if (current.lines.length > 0) sections.push(current);
      current = { heading: line.replace(/:$/, "").trim(), lines: [] };
      continue;
    }

    current.lines.push(normalizeLine(line));
  }

  if (current.lines.length > 0) sections.push(current);
  return sections;
}

function normalizeHeading(heading: string) {
  const clean = heading.replace(/:$/, "").trim();
  if (/^professional summary|summary|profile|profil|résumé|resume$/i.test(clean)) return "Summary";
  if (/^work experience|experience|expérience|expériences$/i.test(clean)) return "Experience";
  if (/^education|formation|formations$/i.test(clean)) return "Education";
  if (/^skills|compétences|competences$/i.test(clean)) return "Skills";
  if (/^languages?|langues?$/i.test(clean)) return "Languages";
  if (/^certifications?|certificats?$/i.test(clean)) return "Certifications";
  return clean;
}

function extractContactLine(text?: string) {
  if (!text) return "";
  const head = text.split("\n").slice(0, 12).join("\n");
  const email = head.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = head.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?){3,5}\d{2,4}/)?.[0];
  const website = head.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/[\w\-/%]+|github\.com\/[\w\-]+|[\w-]+\.(?:dev|io|com|fr))/i)?.[0]?.replace(/^https?:\/\//i, "");
  const location = head.match(/(?:Paris|Lyon|Marseille|Toulouse|Nantes|Bordeaux|Lille|Remote|France|Belgique|Suisse|Canada)/i)?.[0];
  return [email, phone, website, location].filter(Boolean).join(" • ");
}

function drawSectionTitle(doc: PDFKit.PDFDocument, text: string, color = "#0f172a") {
  doc.font("Helvetica-Bold").fontSize(12).fillColor(color).text(text.toUpperCase(), { characterSpacing: 0.6 });
  const underlineY = doc.y + 1;
  doc
    .strokeColor("#cbd5e1")
    .lineWidth(0.8)
    .moveTo(doc.page.margins.left, underlineY)
    .lineTo(doc.page.width - doc.page.margins.right, underlineY)
    .stroke();
  doc.moveDown(0.2);
}

function drawBullets(doc: PDFKit.PDFDocument, lines: string[], max = 18) {
  doc.font("Helvetica").fontSize(10.7).fillColor("#1e293b");
  for (const line of lines.slice(0, max)) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 18) break;
    doc.text(`• ${line}`, { indent: 6, lineGap: 1 });
  }
}

function drawByTemplate(
  doc: PDFKit.PDFDocument,
  templateChoice: TemplateChoice,
  title: string,
  sections: ParsedSection[],
  matchScore?: number,
  contactLine?: string,
) {
  const sectionMap = new Map<string, string[]>();
  for (const section of sections) {
    sectionMap.set(normalizeHeading(section.heading), section.lines);
  }

  if (templateChoice === "Modern Sidebar") {
    const sidebarW = 160;
    const fullH = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    doc.rect(doc.page.margins.left, doc.page.margins.top, sidebarW, fullH).fill("#1e3a8a");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text(title, doc.page.margins.left + 14, doc.page.margins.top + 16, { width: sidebarW - 28 });
    doc.font("Helvetica").fontSize(9).text(contactLine || "", { width: sidebarW - 28 });
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(11).text("SKILLS", doc.page.margins.left + 14, doc.y, { width: sidebarW - 28 });
    doc.font("Helvetica").fontSize(9.8);
    for (const line of (sectionMap.get("Skills") ?? []).slice(0, 14)) {
      doc.text(`• ${line}`, doc.page.margins.left + 14, doc.y, { width: sidebarW - 28, lineGap: 0.5 });
    }

    const mainX = doc.page.margins.left + sidebarW + 18;
    doc.x = mainX;
    doc.y = doc.page.margins.top + 18;
    doc.fillColor("#0f172a");
    drawSectionTitle(doc, "Experience");
    drawBullets(doc, sectionMap.get("Experience") ?? [], 16);
    doc.moveDown(0.3);
    drawSectionTitle(doc, "Education");
    drawBullets(doc, sectionMap.get("Education") ?? [], 10);
    return;
  }

  if (templateChoice === "Executive Grey") {
    const headerH = 90;
    doc.rect(doc.page.margins.left, doc.page.margins.top, doc.page.width - doc.page.margins.left - doc.page.margins.right, headerH).fill("#e5e7eb");
    doc.fillColor("#111111").font("Helvetica-Bold").fontSize(23).text(title, doc.page.margins.left + 18, doc.page.margins.top + 18);
    doc.font("Helvetica").fontSize(10).text(contactLine || "", doc.page.margins.left + 18, doc.page.margins.top + 50);
    doc.y = doc.page.margins.top + headerH + 14;
  } else {
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(26).text(title, { characterSpacing: 0.3 });
    doc.font("Helvetica").fontSize(10.5).fillColor("#334155").text(contactLine || "");

    if (templateChoice === "Modern Accent") {
      const y = doc.y + 8;
      doc.rect(doc.page.margins.left, y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 4).fill("#2563eb");
      doc.y = y + 14;
    } else {
      const y = doc.y + 6;
      doc.strokeColor(templateChoice === "Minimal ATS" ? "#000000" : "#0f172a").lineWidth(templateChoice === "Minimal ATS" ? 1 : 2).moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
      doc.y = y + 8;
    }
  }

  if (typeof matchScore === "number") {
    doc.fillColor("#475569").font("Helvetica").fontSize(9).text(`Match score: ${matchScore}%`);
    doc.moveDown(0.2);
  }

  const titleColor = templateChoice === "Minimal ATS" ? "#000000" : "#0f172a";
  drawSectionTitle(doc, templateChoice === "Minimal ATS" ? "Professional Summary" : "Professional Experience", titleColor);
  drawBullets(doc, sectionMap.get("Experience") ?? sectionMap.get("Summary") ?? [], 18);
  doc.moveDown(0.3);
  drawSectionTitle(doc, "Education", titleColor);
  drawBullets(doc, sectionMap.get("Education") ?? [], 12);
  doc.moveDown(0.3);
  drawSectionTitle(doc, "Skills", titleColor);
  drawBullets(doc, (sectionMap.get("Skills") ?? []).concat(sectionMap.get("Languages") ?? []).concat(sectionMap.get("Certifications") ?? []), 16);
}

export function buildResumePdfBuffer(
  title: string,
  resumeText: string,
  matchScore?: number,
  options?: PdfFallbackOptions,
) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const safeTitle = (title || "Candidature").slice(0, 90);
    const sections = parseSections(resumeText);

    const templateChoice = normalizeTemplateChoice(options?.templateChoice ?? "Executive Classic");
    const contactLine = extractContactLine(options?.originalResumeText);
    drawByTemplate(doc, templateChoice, safeTitle, sections, matchScore, contactLine);

    doc.end();
  });
}
