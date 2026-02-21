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
  contact: z
    .object({
      fullName: z.string().optional().default(""),
      email: z.string().optional().default(""),
      phone: z.string().optional().default(""),
    })
    .optional()
    .default({ fullName: "", email: "", phone: "" }),
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

const experienceListingSchema = z.object({
  experiences: z
    .array(
      z.object({
        jobTitle: z.string().optional().default(""),
        company: z.string().optional().default(""),
        location: z.string().optional().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        isCurrent: z.boolean().optional().default(false),
        achievements: z.array(z.string()).optional().default([]),
        sourceLines: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
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
        content: `Job offer context:\n${args.jobOfferText.slice(0, 8000)}\n\nCV text:\n${args.cvText.slice(0, 18000)}\n\nReturn JSON only with this shape: { contact:{fullName,email,phone}, summary, experiences:[{title,company,date,location,bullets[]}], education:[], skills:[], languages:[], additional:[] }`,
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

  let experienceListing: z.infer<typeof experienceListingSchema> | null = null;

  try {
    const listingCompletion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a professional experience mapping analyst.

First, list all professional experiences found in the CV.

For each experience, map clearly:
- jobTitle
- company
- location
- startDate
- endDate
- isCurrent
- achievements

Rules:
- Keep role and company separated.
- Keep location separated from company.
- Keep dates linked to the correct role.
- Do not invent missing data.
- If uncertain, leave fields empty.
- Return JSON only.`,
        },
        {
          role: "user",
          content: `CV text:\n${args.cvText.slice(0, 18000)}\n\nReturn JSON only with this shape:\n{\n  \"experiences\": [\n    {\n      \"jobTitle\": \"\",\n      \"company\": \"\",\n      \"location\": \"\",\n      \"startDate\": \"\",\n      \"endDate\": \"\",\n      \"isCurrent\": false,\n      \"achievements\": [],\n      \"sourceLines\": []\n    }\n  ]\n}`,
        },
      ],
    });

    const rawListing = listingCompletion.choices[0]?.message?.content;
    if (rawListing) {
      const parsedListing = experienceListingSchema.safeParse(JSON.parse(rawListing));
      if (parsedListing.success) {
        experienceListing = parsedListing.data;
      }
    }
  } catch {
    experienceListing = null;
  }

  const extractionCompletion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Now convert the mapped CV content into strict form JSON.

Follow this schema strictly:
{
  "personalInfo": {...},
  "summary": "",
  "experience": [],
  "education": [],
  "hardSkills": [],
  "softSkills": [],
  "languages": [],
  "certifications": [],
  "volunteering": [],
  "interests": []
}

Normalize dates.
Sort experience from most recent to oldest.
Separate hard and soft skills.
Detect current roles.
Do not invent information.
Return JSON only.

Before returning the JSON, internally reason about the structure of the document and verify consistency of dates and roles.`,
      },
      {
        role: "user",
        content: `Mapped experiences from step 1:\n${JSON.stringify(experienceListing ?? {})}\n\nRaw resume text (fallback context):\n${args.cvText.slice(0, 18000)}\n\nJob offer context (optional):\n${args.jobOfferText.slice(0, 7000)}\n\nSegment everything into the target form schema:\n{\n  \"personalInfo\": {\n    \"fullName\": \"\",\n    \"city\": \"\",\n    \"phone\": \"\",\n    \"email\": \"\",\n    \"linkedin\": \"\"\n  },\n  \"summary\": \"\",\n  \"experience\": [\n    {\n      \"jobTitle\": \"\",\n      \"company\": \"\",\n      \"location\": \"\",\n      \"startDate\": \"\",\n      \"endDate\": \"\",\n      \"isCurrent\": false,\n      \"achievements\": []\n    }\n  ],\n  \"education\": [\n    {\n      \"degree\": \"\",\n      \"institution\": \"\",\n      \"location\": \"\",\n      \"startDate\": \"\",\n      \"endDate\": \"\"\n    }\n  ],\n  \"hardSkills\": [],\n  \"softSkills\": [],\n  \"languages\": [],\n  \"certifications\": [],\n  \"volunteering\": [],\n  \"interests\": []\n}\n\nReturn JSON only.`,
      },
    ],
  });

  const raw = extractionCompletion.choices[0]?.message?.content;
  if (!raw) {
    return null;
  }

  const parsed = hybridCvFormSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return null;
  }

  return parsed.data as HybridCvForm;
}

export async function extractExperienceSummariesWithAI(args: {
  cvText: string;
  jobOfferText: string;
}): Promise<string[] | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "List all professional experiences found in the CV and write one clear concise summary sentence per experience. Keep role, company, location and dates coherent. Do not invent anything. If uncertain, keep it short and factual.",
      },
      {
        role: "user",
        content: `CV text:\n${args.cvText.slice(0, 18000)}\n\nJob offer context (optional):\n${args.jobOfferText.slice(0, 6000)}\n\nReturn plain text only. One experience per line. No JSON. No explanation.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    return null;
  }

  const summaries = raw
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)-])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 20);

  return summaries.length ? summaries : null;
}

export async function adaptStructuredReadWithSummariesAI(args: {
  cvText: string;
  jobOfferText: string;
  heuristicStructured: StructuredCv;
  experienceSummaries: string[];
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
          "You refine CV structured reading for coherence. Use the provided clear experience summaries to correct role/company/location/date mapping. Keep only facts present in resume text or summaries. Never invent information. Return JSON only.",
      },
      {
        role: "user",
        content: `Raw CV text:\n${args.cvText.slice(0, 18000)}\n\nJob offer context:\n${args.jobOfferText.slice(0, 5000)}\n\nCurrent heuristic structured read:\n${JSON.stringify(args.heuristicStructured)}\n\nClear experience summaries:\n${args.experienceSummaries.join("\n")}\n\nReturn JSON only with shape:\n{ contact:{fullName,email,phone}, summary, experiences:[{title,company,date,location,bullets[]}], education:[], skills:[], languages:[], additional:[] }`,
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
