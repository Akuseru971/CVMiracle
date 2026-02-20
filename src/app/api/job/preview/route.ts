import { NextResponse } from "next/server";
import { z } from "zod";
import { extractJobOfferPreview } from "@/lib/job-parser";

const schema = z.object({
  url: z.url(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = schema.safeParse({
    url: searchParams.get("url"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const preview = await extractJobOfferPreview(parsed.data.url);
    return NextResponse.json({ preview });
  } catch {
    return NextResponse.json({ error: "Impossible d'analyser cette offre" }, { status: 422 });
  }
}
