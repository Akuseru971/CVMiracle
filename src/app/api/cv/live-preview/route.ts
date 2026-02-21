import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convertDocxToPdf, convertPdfToDocx } from "@/lib/cloudconvert";
import { parseCvFile, extractTextFromDocxBuffer } from "@/lib/cv-parser";
import { rewriteDocxWithReplacements } from "@/lib/docx-rewrite";
import { getHybridCache, setHybridCache } from "@/lib/hybrid-cache";

export const runtime = "nodejs";

type LiveSession = {
  docxBase64: string;
  sourceText: string;
};

function makeSessionCacheKey(userId: string, sessionKey: string) {
  return `live-preview:${userId}:${sessionKey}`;
}

function normalizeLines(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);
}

function buildReplacements(sourceText: string, editedText: string) {
  const sourceLines = normalizeLines(sourceText);
  const editedLines = normalizeLines(editedText);
  const max = Math.min(sourceLines.length, editedLines.length);

  const replacements: Array<{ from: string; to: string }> = [];
  for (let index = 0; index < max; index += 1) {
    const from = sourceLines[index];
    const to = editedLines[index];

    if (!from || !to || from === to) continue;
    replacements.push({ from, to });
  }

  return replacements.filter(
    (item, index, arr) =>
      arr.findIndex((candidate) => candidate.from.toLowerCase() === item.from.toLowerCase()) === index,
  );
}

async function initializeSession(userId: string, file: File) {
  const parsed = await parseCvFile(file);

  if (parsed.fileType !== "pdf") {
    throw new Error("Mode live disponible uniquement pour les fichiers PDF.");
  }

  const docxBuffer = await convertPdfToDocx(parsed.buffer);
  const sourceText = await extractTextFromDocxBuffer(docxBuffer);
  const fingerprint = createHash("sha256").update(parsed.buffer).digest("hex").slice(0, 16);
  const sessionKey = `${fingerprint}-${randomUUID()}`;

  setHybridCache<LiveSession>(makeSessionCacheKey(userId, sessionKey), {
    docxBase64: docxBuffer.toString("base64"),
    sourceText,
  });

  return { sessionKey, sourceText };
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();

  try {
    if (action === "init") {
      const file = formData.get("cvFile");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Fichier PDF requis." }, { status: 400 });
      }

      const initialized = await initializeSession(user.id, file);
      return NextResponse.json({
        sessionKey: initialized.sessionKey,
        sourceText: initialized.sourceText,
      });
    }

    if (action === "preview") {
      const sessionKey = String(formData.get("sessionKey") ?? "").trim();
      const editedText = String(formData.get("editedText") ?? "");

      if (!sessionKey) {
        return NextResponse.json({ error: "Session invalide." }, { status: 400 });
      }

      const session = getHybridCache<LiveSession>(makeSessionCacheKey(user.id, sessionKey));
      if (!session) {
        return NextResponse.json({ error: "Session expirée. Recharge le PDF." }, { status: 410 });
      }

      const replacements = buildReplacements(session.sourceText, editedText);
      if (!replacements.length) {
        return NextResponse.json({ pdfBase64: null, unchanged: true });
      }

      const originalDocxBuffer = Buffer.from(session.docxBase64, "base64");
      const rewrittenDocx = await rewriteDocxWithReplacements(originalDocxBuffer, replacements);
      const previewPdf = await convertDocxToPdf(rewrittenDocx);

      return NextResponse.json({
        pdfBase64: previewPdf.toString("base64"),
        unchanged: false,
      });
    }

    return NextResponse.json({ error: "Action non supportée." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de prévisualisation live.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
