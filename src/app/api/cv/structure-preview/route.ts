import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { parseCvFile } from "@/lib/cv-parser";
import { extractJobOfferText } from "@/lib/job-parser";
import {
  parseStructuredCvFromText,
  sanitizeStructuredCv,
  type StructuredCv,
} from "@/lib/cv-structure";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractStructuredCvWithAI } from "@/lib/openai";

export const runtime = "nodejs";

const schema = z.object({
  jobUrl: z.url(),
});

function mergeStructuredCv(base: StructuredCv, ai: StructuredCv | null): StructuredCv {
  if (!ai) return base;

  const merged: StructuredCv = {
    summary: ai.summary?.trim() || base.summary,
    experiences: ai.experiences.length ? ai.experiences : base.experiences,
    education: ai.education.length ? ai.education : base.education,
    skills: ai.skills.length ? ai.skills : base.skills,
    languages: ai.languages.length ? ai.languages : base.languages,
    additional: ai.additional.length ? ai.additional : base.additional,
  };

  return sanitizeStructuredCv(merged);
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const limiter = checkRateLimit(`structure-preview:${user.id}`, 30, 60 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Limite de prévisualisation atteinte" }, { status: 429 });
  }

  const formData = await request.formData();
  const rawJobUrl = formData.get("jobUrl");
  const file = formData.get("cvFile");

  const parsed = schema.safeParse({ jobUrl: rawJobUrl });

  if (!parsed.success || !(file instanceof File)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const [jobOfferText, parsedCv] = await Promise.all([
    extractJobOfferText(parsed.data.jobUrl),
    parseCvFile(file),
  ]);

  const heuristic = parseStructuredCvFromText(parsedCv.text);

  let aiStructured: StructuredCv | null = null;
  try {
    aiStructured = await extractStructuredCvWithAI({
      cvText: parsedCv.text,
      jobOfferText,
    });
  } catch {
    aiStructured = null;
  }

  const structuredCv = mergeStructuredCv(heuristic, aiStructured);

  return NextResponse.json({
    structuredCv,
    source: aiStructured ? "hybrid" : "heuristic",
  });
}
