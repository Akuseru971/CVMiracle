import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const items = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      matchScore: true,
      templateChoice: true,
      keywords: true,
      missingSkills: true,
      atsOptimized: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items });
}
