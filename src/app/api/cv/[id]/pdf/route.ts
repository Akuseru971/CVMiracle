import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { decryptText } from "@/lib/crypto";
import { buildResumePdfBuffer } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";
import { renderResumePdfWithPuppeteer } from "@/lib/puppeteer-pdf";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;

  const { searchParams } = new URL(request.url);
  const inline = searchParams.get("inline") === "1";

  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    select: {
      title: true,
      optimizedCvEnc: true,
      templateChoice: true,
      matchScore: true,
      keywords: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
  }

  const decrypted = decryptText(application.optimizedCvEnc);

  try {
    const parsed = JSON.parse(decrypted) as {
      kind?: string;
      mimeType?: string;
      fileName?: string;
      base64?: string;
      optimizedText?: string;
    };

    if (parsed.kind === "pdf-asset" && parsed.base64) {
      const buffer = Buffer.from(parsed.base64, "base64");
      const headers = new Headers();
      headers.set("Content-Type", parsed.mimeType ?? "application/pdf");
      headers.set(
        "Content-Disposition",
        `${inline ? "inline" : "attachment"}; filename="${parsed.fileName ?? `${application.title.replace(/[^a-z0-9]/gi, "_")}.pdf`}"`,
      );
      return new NextResponse(new Uint8Array(buffer), { headers });
    }
  } catch {
  }

  let pdf: Buffer;

  try {
    pdf = await renderResumePdfWithPuppeteer({
      title: application.title,
      resumeText: decrypted,
      templateChoice: application.templateChoice as
        | "Original Design Enhanced"
        | "Modern Executive"
        | "Minimal ATS",
      matchScore: application.matchScore,
      keywords: Array.isArray(application.keywords) ? (application.keywords as string[]) : [],
    });
  } catch {
    pdf = await buildResumePdfBuffer(application.title, decrypted);
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `${inline ? "inline" : "attachment"}; filename="${application.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
  );

  return new NextResponse(new Uint8Array(pdf), { headers });
}
