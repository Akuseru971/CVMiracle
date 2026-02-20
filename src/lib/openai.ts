import OpenAI from "openai";
import { z } from "zod";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai-prompt";

const outputSchema = z.object({
  optimizedResume: z.string().min(50),
  matchScore: z.number().int().min(0).max(100),
  keywordsIntegrated: z.array(z.string()).min(1).max(20),
  missingSkills: z.array(z.string()).max(20),
});

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

export async function optimizeResumeWithAI(args: {
  jobOfferText: string;
  cvText: string;
  templateChoice: "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";
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
