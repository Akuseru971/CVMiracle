import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { decryptText, encryptText } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { sanitizeStructuredCv } from "@/lib/cv-structure";

const titleSchema = z.object({
  title: z.string().min(3).max(120),
});

const structuredSchema = z.object({
  structuredCv: z.object({
    summary: z.string().default(""),
    experiences: z.array(
      z.object({
        title: z.string(),
        company: z.string().default(""),
        date: z.string().default(""),
        bullets: z.array(z.string()).default([]),
      }),
    ).default([]),
    education: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    additional: z.array(z.string()).default([]),
  }),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const titleParsed = titleSchema.safeParse(body);
  if (titleParsed.success) {
    const updated = await prisma.jobApplication.updateMany({
      where: { id, userId: user.id },
      data: { title: titleParsed.data.title },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  const structuredParsed = structuredSchema.safeParse(body);
  if (!structuredParsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    select: { optimizedCvEnc: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
  }

  const decrypted = decryptText(application.optimizedCvEnc);
  let optimizedText = decrypted;

  try {
    const parsed = JSON.parse(decrypted) as { optimizedText?: string };
    if (parsed.optimizedText?.trim()) {
      optimizedText = parsed.optimizedText;
    }
  } catch {
  }

  const payload = JSON.stringify({
    kind: "structured-v1",
    optimizedText,
    structuredCv: sanitizeStructuredCv(structuredParsed.data.structuredCv),
  });

  await prisma.jobApplication.updateMany({
    where: { id, userId: user.id },
    data: { optimizedCvEnc: encryptText(payload) },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.jobApplication.deleteMany({
    where: { id, userId: user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
