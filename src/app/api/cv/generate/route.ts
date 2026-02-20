import { NextResponse } from "next/server";
import { CreditReason } from "@prisma/client";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { extractTextFromDocxBuffer, parseCvFile } from "@/lib/cv-parser";
import { convertDocxToPdf, convertPdfToDocx } from "@/lib/cloudconvert";
import { encryptText } from "@/lib/crypto";
import { rewriteDocxWithReplacements } from "@/lib/docx-rewrite";
import { extractJobOfferText } from "@/lib/job-parser";
import { generateDocxReplacements, optimizeResumeWithAI } from "@/lib/openai";
import { buildOriginalDesignEnhancedPdf } from "@/lib/pdf-enhance";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  jobUrl: z.url(),
  templateChoice: z.enum(["Original Design Enhanced", "Modern Executive", "Minimal ATS"]),
});

function inferTitle(jobText: string) {
  const firstLine = jobText.split(".")[0]?.trim();
  return firstLine ? firstLine.slice(0, 80) : "Application optimisée";
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const limiter = checkRateLimit(`generate:${user.id}`, 20, 60 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Limite de génération atteinte" }, { status: 429 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { credits: true } });
  if (!dbUser || dbUser.credits <= 0) {
    return NextResponse.json({ error: "Crédits insuffisants" }, { status: 402 });
  }

  const formData = await request.formData();
  const rawJobUrl = formData.get("jobUrl");
  const rawTemplateChoice = formData.get("templateChoice");
  const file = formData.get("cvFile");

  const parsed = schema.safeParse({
    jobUrl: rawJobUrl,
    templateChoice: rawTemplateChoice,
  });

  if (!parsed.success || !(file instanceof File)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const [jobOfferText, parsedCv] = await Promise.all([
    extractJobOfferText(parsed.data.jobUrl),
    parseCvFile(file),
  ]);

  const cvText = parsedCv.text;

  const aiResult = await optimizeResumeWithAI({
    jobOfferText,
    cvText,
    templateChoice: parsed.data.templateChoice,
  });

  let optimizedPayload = aiResult.optimizedResume;

  if (parsed.data.templateChoice === "Original Design Enhanced" && parsedCv.fileType === "pdf") {
    try {
      const convertedDocx = await convertPdfToDocx(parsedCv.buffer);
      const convertedText = await extractTextFromDocxBuffer(convertedDocx);

      const replacements = await generateDocxReplacements({
        originalText: convertedText,
        optimizedText: aiResult.optimizedResume,
      });

      const rewrittenDocx = await rewriteDocxWithReplacements(convertedDocx, replacements);
      const rewrittenPdf = await convertDocxToPdf(rewrittenDocx);

      optimizedPayload = JSON.stringify({
        kind: "pdf-asset",
        mimeType: "application/pdf",
        fileName: `optimized_${parsedCv.originalName.replace(/\.pdf$/i, "")}.pdf`,
        base64: rewrittenPdf.toString("base64"),
        optimizedText: aiResult.optimizedResume,
      });
    } catch {
      const preservedPdf = await buildOriginalDesignEnhancedPdf(parsedCv.buffer, aiResult.optimizedResume);
      optimizedPayload = JSON.stringify({
        kind: "pdf-asset",
        mimeType: "application/pdf",
        fileName: `optimized_${parsedCv.originalName.replace(/\.pdf$/i, "")}.pdf`,
        base64: preservedPdf.toString("base64"),
        optimizedText: aiResult.optimizedResume,
      });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: user.id, credits: { gt: 0 } },
      data: { credits: { decrement: 1 } },
    });

    if (updated.count === 0) {
      throw new Error("Crédits insuffisants");
    }

    const application = await tx.jobApplication.create({
      data: {
        userId: user.id,
        title: inferTitle(jobOfferText),
        jobUrl: parsed.data.jobUrl,
        jobOfferEncrypted: encryptText(jobOfferText),
        originalCvEnc: encryptText(cvText),
        optimizedCvEnc: encryptText(optimizedPayload),
        templateChoice: parsed.data.templateChoice,
        matchScore: aiResult.matchScore,
        keywords: aiResult.keywordsIntegrated,
        missingSkills: aiResult.missingSkills,
        atsOptimized: true,
      },
      select: {
        id: true,
        title: true,
        matchScore: true,
        templateChoice: true,
        atsOptimized: true,
        createdAt: true,
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: user.id,
        delta: -1,
        reason: CreditReason.CV_GENERATION,
        meta: {
          applicationId: application.id,
        },
      },
    });

    const freshUser = await tx.user.findUnique({ where: { id: user.id }, select: { credits: true } });
    return { application, credits: freshUser?.credits ?? 0 };
  });

  return NextResponse.json({
    application: created.application,
    credits: created.credits,
    preview: {
      optimizedResume: aiResult.optimizedResume,
      keywordsIntegrated: aiResult.keywordsIntegrated,
      missingSkills: aiResult.missingSkills,
    },
  });
}
