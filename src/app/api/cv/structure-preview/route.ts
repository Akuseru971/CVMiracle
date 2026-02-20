import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { parseCvFile } from "@/lib/cv-parser";
import { extractJobOfferText } from "@/lib/job-parser";
import {
  parseStructuredCvFromText,
} from "@/lib/cv-structure";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractHybridCvFormWithAI } from "@/lib/openai";
import {
  computeHybridConfidence,
  detectDateOverlaps,
  mapHybridToStructured,
  mapStructuredToHybrid,
  sanitizeHybridCvForm,
  sortExperiencesMostRecent,
  type HybridCvForm,
} from "@/lib/hybrid-form";
import { getHybridCache, setHybridCache } from "@/lib/hybrid-cache";

export const runtime = "nodejs";

const schema = z.object({
  jobUrl: z.url(),
});

function mergeHybrid(base: HybridCvForm, ai: HybridCvForm | null) {
  if (!ai) return base;

  const merged = sanitizeHybridCvForm({
    personalInfo: {
      fullName: ai.personalInfo.fullName || base.personalInfo.fullName,
      city: ai.personalInfo.city || base.personalInfo.city,
      phone: ai.personalInfo.phone || base.personalInfo.phone,
      email: ai.personalInfo.email || base.personalInfo.email,
      linkedin: ai.personalInfo.linkedin || base.personalInfo.linkedin,
    },
    summary: ai.summary || base.summary,
    experience: ai.experience.length ? ai.experience : base.experience,
    education: ai.education.length ? ai.education : base.education,
    hardSkills: ai.hardSkills.length ? ai.hardSkills : base.hardSkills,
    softSkills: ai.softSkills.length ? ai.softSkills : base.softSkills,
    languages: ai.languages.length ? ai.languages : base.languages,
    certifications: ai.certifications.length ? ai.certifications : base.certifications,
    volunteering: ai.volunteering.length ? ai.volunteering : base.volunteering,
    interests: ai.interests.length ? ai.interests : base.interests,
  });

  return {
    ...merged,
    experience: sortExperiencesMostRecent(merged.experience),
  };
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

  const cacheKey = createHash("sha256")
    .update(`${parsed.data.jobUrl}::${parsedCv.text.slice(0, 12000)}`)
    .digest("hex");

  const cached = getHybridCache<{
    hybridForm: HybridCvForm;
    source: "hybrid" | "heuristic";
    confidence: ReturnType<typeof computeHybridConfidence>;
    overlapWarnings: string[];
    suggestedImprovements: string[];
  }>(cacheKey);

  if (cached) {
    return NextResponse.json({
      ...cached,
      structuredCv: mapHybridToStructured(cached.hybridForm),
      cacheHit: true,
    });
  }

  const heuristicStructured = parseStructuredCvFromText(parsedCv.text);
  const heuristicHybrid = mapStructuredToHybrid(heuristicStructured);

  let aiHybrid: HybridCvForm | null = null;
  try {
    aiHybrid = await extractHybridCvFormWithAI({
      cvText: parsedCv.text,
      jobOfferText,
    });
  } catch {
    aiHybrid = null;
  }

  const hybridForm = mergeHybrid(heuristicHybrid, aiHybrid);
  const confidence = computeHybridConfidence(hybridForm);
  const overlapWarnings = detectDateOverlaps(hybridForm.experience);
  const suggestedImprovements = [
    confidence.summary < 60 ? "Compléter le résumé professionnel." : "",
    confidence.experience < 80 ? "Ajouter des missions chiffrées par expérience." : "",
    confidence.hardSkills < 70 ? "Ajouter davantage de hard skills spécifiques." : "",
    overlapWarnings.length ? "Vérifier les chevauchements de dates détectés." : "",
  ].filter(Boolean);

  const responsePayload = {
    hybridForm,
    source: aiHybrid ? "hybrid" : "heuristic",
    confidence,
    overlapWarnings,
    suggestedImprovements,
  } as const;

  setHybridCache(cacheKey, responsePayload);

  return NextResponse.json({
    ...responsePayload,
    structuredCv: mapHybridToStructured(hybridForm),
    cacheHit: false,
  });
}
