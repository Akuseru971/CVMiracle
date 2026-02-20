import OpenAI from "openai";
import { z } from "zod";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai-prompt";
import type { TemplateChoice } from "@/lib/template-options";

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
