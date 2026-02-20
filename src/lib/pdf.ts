import PDFDocument from "pdfkit";

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

export function buildResumePdfBuffer(title: string, resumeText: string, matchScore?: number) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const safeTitle = (title || "Candidature").slice(0, 90);
    const sections = parseSections(resumeText);

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#0f172a").text(safeTitle, {
      lineBreak: true,
      characterSpacing: 0.5,
    });

    doc.moveDown(0.15);
    doc.font("Helvetica").fontSize(9).fillColor("#475569");
    if (typeof matchScore === "number") {
      doc.text(`Match score: ${matchScore}%`);
    }

    const yLine = doc.y + 6;
    doc
      .strokeColor("#d5dde8")
      .lineWidth(1)
      .moveTo(doc.page.margins.left, yLine)
      .lineTo(doc.page.width - doc.page.margins.right, yLine)
      .stroke();

    doc.y = yLine + 8;

    doc.font("Helvetica").fontSize(10.6).fillColor("#1e293b");
    for (const section of sections) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 60) {
        break;
      }

      doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text(section.heading.toUpperCase(), {
        characterSpacing: 0.8,
      });

      const underlineY = doc.y + 1;
      doc
        .strokeColor("#cbd5e1")
        .lineWidth(0.8)
        .moveTo(doc.page.margins.left, underlineY)
        .lineTo(doc.page.width - doc.page.margins.right, underlineY)
        .stroke();

      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(10.6).fillColor("#1e293b");

      for (const line of section.lines.slice(0, 18)) {
        if (doc.y > doc.page.height - doc.page.margins.bottom - 18) {
          break;
        }

        doc.text(`• ${line}`, {
          indent: 6,
          lineGap: 1,
        });
      }

      doc.moveDown(0.35);
    }

    doc.end();
  });
}
