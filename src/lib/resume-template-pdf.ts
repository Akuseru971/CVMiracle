import PDFDocument from "pdfkit";

type TemplateChoice = "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";

type TemplateArgs = {
  title: string;
  resumeText: string;
  templateChoice: TemplateChoice;
  matchScore?: number;
  keywords?: string[];
};

type ResumeSection = {
  heading: string;
  lines: string[];
};

const KNOWN_HEADINGS = [
  "Professional Summary",
  "Summary",
  "Work Experience",
  "Experience",
  "Education",
  "Skills",
  "Certifications",
  "Projects",
  "Languages",
];

function parseSections(raw: string): ResumeSection[] {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: ResumeSection[] = [];
  let current: ResumeSection = { heading: "Profile", lines: [] };

  for (const line of lines) {
    const clean = line.replace(/:$/, "");
    const looksHeading =
      KNOWN_HEADINGS.includes(clean) ||
      (/^[A-Z][A-Za-z\s]{3,30}$/.test(clean) && line.length < 40 && !line.startsWith("-"));

    if (looksHeading) {
      if (current.lines.length) sections.push(current);
      current = { heading: clean, lines: [] };
      continue;
    }

    current.lines.push(line);
  }

  if (current.lines.length) sections.push(current);
  return sections;
}

function ensurePageSpace(doc: PDFKit.PDFDocument, needed = 50) {
  if (doc.y > doc.page.height - needed) {
    doc.addPage();
  }
}

function renderMinimalATS(doc: PDFKit.PDFDocument, args: TemplateArgs, sections: ResumeSection[]) {
  doc.font("Helvetica-Bold").fontSize(20).fillColor("black").text(args.title);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).fillColor("#333").text("ATS Optimized Resume");
  doc.moveDown(0.8);

  for (const section of sections) {
    ensurePageSpace(doc, 70);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("black").text(section.heading.toUpperCase());
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10.5).fillColor("#222");

    for (const line of section.lines) {
      ensurePageSpace(doc, 45);
      if (line.startsWith("-") || line.startsWith("•")) {
        doc.text(`• ${line.replace(/^[-•]\s*/, "")}`, { indent: 12, lineGap: 2 });
      } else {
        doc.text(line, { lineGap: 2 });
      }
    }
    doc.moveDown(0.6);
  }
}

function renderModernExecutive(doc: PDFKit.PDFDocument, args: TemplateArgs, sections: ResumeSection[]) {
  const pageWidth = doc.page.width;
  doc.rect(0, 0, pageWidth, 115).fill("#0f172a");
  doc.fillColor("white").font("Helvetica-Bold").fontSize(22).text(args.title, 40, 34, {
    width: pageWidth - 80,
  });

  doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1").text(
    `Executive Template • Match ${args.matchScore ?? "N/A"}%`,
    40,
    68,
  );

  if (args.keywords?.length) {
    doc.font("Helvetica").fontSize(9).fillColor("#e2e8f0").text(
      `Keywords: ${args.keywords.slice(0, 6).join(" • ")}`,
      40,
      86,
      { width: pageWidth - 80 },
    );
  }

  doc.y = 140;

  for (const section of sections) {
    ensurePageSpace(doc, 80);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text(section.heading, {
      continued: false,
    });

    doc.moveDown(0.2);
    doc.moveTo(40, doc.y).lineTo(pageWidth - 40, doc.y).strokeColor("#cbd5e1").lineWidth(1).stroke();
    doc.moveDown(0.4);

    doc.font("Helvetica").fontSize(10.5).fillColor("#1e293b");
    for (const line of section.lines) {
      ensurePageSpace(doc, 45);
      const bullet = line.startsWith("-") || line.startsWith("•");
      doc.text(bullet ? `• ${line.replace(/^[-•]\s*/, "")}` : line, {
        lineGap: 2,
        indent: bullet ? 12 : 0,
      });
    }
    doc.moveDown(0.6);
  }
}

function renderOriginalEnhanced(doc: PDFKit.PDFDocument, args: TemplateArgs, sections: ResumeSection[]) {
  doc.font("Helvetica-Bold").fontSize(21).fillColor("#111827").text(args.title);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).fillColor("#4b5563").text("Original Design Enhanced");
  doc.moveDown(0.9);

  for (const section of sections) {
    ensurePageSpace(doc, 75);
    doc.roundedRect(35, doc.y - 2, doc.page.width - 70, 22, 6).fill("#f3f4f6");
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11).text(section.heading, 44, doc.y + 3);
    doc.moveDown(1.1);

    doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937");
    for (const line of section.lines) {
      ensurePageSpace(doc, 45);
      if (line.startsWith("-") || line.startsWith("•")) {
        doc.text(`• ${line.replace(/^[-•]\s*/, "")}`, { indent: 12, lineGap: 2 });
      } else {
        doc.text(line, { lineGap: 2 });
      }
    }

    doc.moveDown(0.7);
  }
}

export function buildTemplatedResumePdfBuffer(args: TemplateArgs) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const sections = parseSections(args.resumeText);

    if (args.templateChoice === "Minimal ATS") {
      renderMinimalATS(doc, args, sections);
    } else if (args.templateChoice === "Modern Executive") {
      renderModernExecutive(doc, args, sections);
    } else {
      renderOriginalEnhanced(doc, args, sections);
    }

    doc.end();
  });
}
