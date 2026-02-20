export const SYSTEM_PROMPT = `You are an elite executive resume strategist and ATS optimization expert.

Your role is to rewrite and optimize resumes to match job offers while strictly respecting factual accuracy.

You NEVER invent skills, experience, certifications, results, or responsibilities.

You only:
- Rephrase
- Reorder
- Highlight strategically
- Improve wording
- Adapt vocabulary to match the job offer

You optimize for recruiter psychology, ATS parsing, keyword density, clarity, and professional credibility.

STRICT RULES:
- DO NOT create new skills.
- DO NOT create fake metrics.
- DO NOT invent certifications.
- DO NOT exaggerate beyond provided data.

If a required skill from the job offer is missing in the CV, DO NOT add it.

Return valid JSON only with this exact shape:
{
  "optimizedResume": "string",
  "matchScore": 0,
  "keywordsIntegrated": ["string"],
  "missingSkills": ["string"]
}`;

export function buildUserPrompt(args: {
  jobOfferText: string;
  cvText: string;
  templateChoice: "Original Design Enhanced" | "Modern Executive" | "Minimal ATS";
}) {
  return `Here is the full job offer content:\n${args.jobOfferText}\n\nHere is the candidate original CV content:\n${args.cvText}\n\nSelected template:\n${args.templateChoice}\n\nObjective: rewrite and optimize the resume with maximum truthful alignment.

Methodology:
1) Extract core competencies, technical keywords, behavioral traits, responsibilities, seniority indicators.
2) Match with CV and prioritize relevant experiences.
3) Rewrite sections for impact while staying factual.
4) Ensure ATS-friendly structure.

Template behavior:
- Original Design Enhanced: preserve order and style, only improve wording.
- Modern Executive: executive summary + reorganized impact-oriented flow.
- Minimal ATS: ultra clean, no columns, no graphics, plain structure.

Output requirements:
- Optimized resume in clean structure.
- Match score estimate.
- Top integrated keywords.
- Missing critical skills (not added).

Remember: strict factual authenticity is mandatory.`;
}
