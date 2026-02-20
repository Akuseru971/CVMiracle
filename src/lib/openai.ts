import OpenAI from "openai";
import { z } from "zod";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai-prompt";
import type { TemplateChoice } from "@/lib/template-options";
import type { StructuredCv } from "@/lib/cv-structure";
import type { HybridCvForm } from "@/lib/hybrid-form";

const outputSchema = z.object({
  optimizedResume: z.string().min(50),
  matchScore: z.number().int().min(0).max(100),
  keywordsIntegrated: z.array(z.string()).min(1).max(20),
  missingSkills: z.array(z.string()).max(20),
});

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

const replacementsSchema = z.object({
  replacements: z.array(
    z.object({
      from: z.string().min(3),
      to: z.string().min(3),
    }),
  ),
});

const structuredCvSchema = z.object({
  summary: z.string().optional().default(""),
  experiences: z
    .array(
      z.object({
        title: z.string().optional().default(""),
        company: z.string().optional().default(""),
        date: z.string().optional().default(""),
        location: z.string().optional().default(""),
        bullets: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  education: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  additional: z.array(z.string()).optional().default([]),
});

const hybridCvFormSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().optional().default(""),
    city: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    email: z.string().optional().default(""),
    linkedin: z.string().optional().default(""),
  }),
  summary: z.string().optional().default(""),
  experience: z
    .array(
      z.object({
        jobTitle: z.string().optional().default(""),
        company: z.string().optional().default(""),
        location: z.string().optional().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        isCurrent: z.boolean().optional().default(false),
        achievements: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().optional().default(""),
        institution: z.string().optional().default(""),
        location: z.string().optional().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
      }),
    )
    .optional()
    .default([]),
  hardSkills: z.array(z.string()).optional().default([]),
  softSkills: z.array(z.string()).optional().default([]),
  languages: z
    .array(
      z.object({
        language: z.string().optional().default(""),
        level: z.string().optional().default(""),
      }),
    )
    .optional()
    .default([]),
  certifications: z.array(z.string()).optional().default([]),
  volunteering: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
});

export async function optimizeResumeWithAI(args: {
  jobOfferText: string;
  cvText: string;
  templateChoice: TemplateChoice;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY manquant");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(args) },
    ],
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Réponse IA vide");
  }

  const parsed = outputSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("Réponse IA invalide");
  }

  return parsed.data;
}

export async function generateDocxReplacements(args: {
  originalText: string;
  optimizedText: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY manquant");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "Generate exact text replacement pairs from original to optimized CV wording. Never invent source snippets. Return JSON only: { replacements: [{ from, to }] }",
      },
      {
        role: "user",
        content: `Original CV text:\n${args.originalText}\n\nOptimized CV text:\n${args.optimizedText}\n\nReturn up to 120 high-value replacements.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return [];
  }

  const parsed = replacementsSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return [];
  }

  return parsed.data.replacements;
}

export async function extractStructuredCvWithAI(args: {
  cvText: string;
  jobOfferText: string;
}): Promise<StructuredCv | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Extract a resume into strict JSON fields. Never invent data. Keep only information present in CV text. Limit each experience to maximum 4 bullets.",
      },
      {
        role: "user",
        content: `Job offer context:\n${args.jobOfferText.slice(0, 8000)}\n\nCV text:\n${args.cvText.slice(0, 18000)}\n\nReturn JSON only with this shape: { summary, experiences:[{title,company,date,location,bullets[]}], education:[], skills:[], languages:[], additional:[] }`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return null;
  }

  const parsed = structuredCvSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return null;
  }

  return parsed.data as StructuredCv;
}

export async function extractHybridCvFormWithAI(args: {
  cvText: string;
  jobOfferText: string;
}): Promise<HybridCvForm | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Extract CV data into strict JSON. Never invent information. Keep unknown fields empty. Return JSON only and no commentary.",
      },
      {
        role: "user",
        content: `Job offer context:\n${args.jobOfferText.slice(0, 7000)}\n\nCV text:\n${args.cvText.slice(0, 18000)}\n\nReturn JSON with this exact shape:\n{\n  \"personalInfo\": { \"fullName\": \"\", \"city\": \"\", \"phone\": \"\", \"email\": \"\", \"linkedin\": \"\" },\n  \"summary\": \"\",\n  \"experience\": [{ \"jobTitle\": \"\", \"company\": \"\", \"location\": \"\", \"startDate\": \"\", \"endDate\": \"\", \"isCurrent\": false, \"achievements\": [] }],\n  \"education\": [{ \"degree\": \"\", \"institution\": \"\", \"location\": \"\", \"startDate\": \"\", \"endDate\": \"\" }],\n  \"hardSkills\": [],\n  \"softSkills\": [],\n  \"languages\": [{ \"language\": \"\", \"level\": \"\" }],\n  \"certifications\": [],\n  \"volunteering\": [],\n  \"interests\": []\n}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return null;
  }

  const parsed = hybridCvFormSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return null;
  }

  return parsed.data as HybridCvForm;
}
