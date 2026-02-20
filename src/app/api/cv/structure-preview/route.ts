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
import { extractExperienceSummariesWithAI } from "@/lib/openai";
import {
  computeHybridConfidence,
  detectDateOverlaps,
  mapHybridToStructured,
  mapStructuredToHybrid,
  sortExperiencesMostRecent,
  type HybridCvForm,
} from "@/lib/hybrid-form";
import { getHybridCache, setHybridCache } from "@/lib/hybrid-cache";

export const runtime = "nodejs";

const schema = z.object({
  jobUrl: z.url(),
});

function applyExperienceSummaries(base: HybridCvForm, summaries: string[] | null) {
  const normalized = sortExperiencesMostRecent(base.experience);

  const experience = normalized.map((entry, index) => {
    const summary = summaries?.[index]?.trim();
    if (!summary) return entry;

    if (!entry.achievements.length) {
      return {
        ...entry,
        achievements: [summary],
      };
    }

    const alreadyPresent = entry.achievements.some(
      (item) => item.toLowerCase() === summary.toLowerCase(),
    );

    return alreadyPresent
      ? entry
      : {
          ...entry,
          achievements: [summary, ...entry.achievements].slice(0, 6),
        };
  });

  return {
    ...base,
    experience,
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
    source: "hybrid-summaries" | "heuristic";
    confidence: ReturnType<typeof computeHybridConfidence>;
    overlapWarnings: string[];
    suggestedImprovements: string[];
    experienceSummaries: string[];
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

  let experienceSummaries: string[] | null = null;
  try {
    experienceSummaries = await extractExperienceSummariesWithAI({
      cvText: parsedCv.text,
      jobOfferText,
    });
  } catch {
    experienceSummaries = null;
  }

  const hybridForm = applyExperienceSummaries(heuristicHybrid, experienceSummaries);
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
    source: experienceSummaries?.length ? "hybrid-summaries" : "heuristic",
    confidence,
    overlapWarnings,
    suggestedImprovements,
    experienceSummaries: experienceSummaries ?? [],
  } as const;

  setHybridCache(cacheKey, responsePayload);

  return NextResponse.json({
    ...responsePayload,
    structuredCv: mapHybridToStructured(hybridForm),
    cacheHit: false,
  });
}
