import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { parseCvFile } from "@/lib/cv-parser";
import { encryptText } from "@/lib/crypto";
import { extractJobOfferText } from "@/lib/job-parser";
import { optimizeResumeWithAI } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { TEMPLATE_CHOICES } from "@/lib/template-options";

export const runtime = "nodejs";

const schema = z.object({
  jobUrl: z.url(),
  templateChoice: z.enum(TEMPLATE_CHOICES),
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

  const optimizedPayload = aiResult.optimizedResume;

  const created = await prisma.$transaction(async (tx) => {
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
