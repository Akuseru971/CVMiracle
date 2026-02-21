import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { decryptText } from "@/lib/crypto";
import { buildResumePdfBuffer } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";
import { renderResumePdfWithPuppeteer } from "@/lib/puppeteer-pdf";
import { normalizeTemplateChoice } from "@/lib/template-options";
import type { StructuredCv } from "@/lib/cv-structure";

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
  const forcedTemplateChoice = searchParams.get("templateChoice");

  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    select: {
      title: true,
      originalCvEnc: true,
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
  const originalCvText = decryptText(application.originalCvEnc);
  let resumeTextForTemplate = decrypted;
  let structuredCv: StructuredCv | undefined;

  try {
    const parsed = JSON.parse(decrypted) as {
      kind?: string;
      mimeType?: string;
      fileName?: string;
      base64?: string;
      optimizedText?: string;
      structuredCv?: StructuredCv;
    };

    if (parsed.kind === "pdf-asset") {
      if (parsed.optimizedText?.trim()) {
        resumeTextForTemplate = parsed.optimizedText;
      }
    }

    if (parsed.kind === "structured-v1") {
      if (parsed.optimizedText?.trim()) {
        resumeTextForTemplate = parsed.optimizedText;
      }
      if (parsed.structuredCv) {
        structuredCv = parsed.structuredCv;
      }
    }
  } catch {
  }

  let pdf: Buffer | null = null;

  try {
    pdf = await renderResumePdfWithPuppeteer({
      title: application.title,
      originalResumeText: originalCvText,
      optimizedResumeText: resumeTextForTemplate,
      structuredCv,
      templateChoice: normalizeTemplateChoice(forcedTemplateChoice ?? application.templateChoice),
      matchScore: application.matchScore,
      keywords: Array.isArray(application.keywords) ? (application.keywords as string[]) : [],
    });
  } catch {
    pdf = await buildResumePdfBuffer(
      structuredCv?.contact?.fullName?.trim() || application.title,
      resumeTextForTemplate,
      application.matchScore,
      {
        templateChoice: forcedTemplateChoice ?? application.templateChoice,
        originalResumeText: originalCvText,
        contactOverride: {
          email: structuredCv?.contact?.email,
          phone: structuredCv?.contact?.phone,
        },
      },
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `${inline ? "inline" : "attachment"}; filename="${application.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
  );

  return new NextResponse(new Uint8Array(pdf), { headers });
}
