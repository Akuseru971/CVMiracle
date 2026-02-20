import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { decryptText } from "@/lib/crypto";
import { buildResumePdfBuffer } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;

  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    select: {
      title: true,
      optimizedCvEnc: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
  }

  const resumeText = decryptText(application.optimizedCvEnc);
  const pdf = await buildResumePdfBuffer(application.title, resumeText);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${application.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
  );

  return new NextResponse(new Uint8Array(pdf), { headers });
}
