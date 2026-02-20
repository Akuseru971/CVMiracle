import { NextResponse } from "next/server";
import { z } from "zod";
import { CreditReason } from "@prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword, setAuthCookie, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(80).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(`register:${ip}`, 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Compte déjà existant" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      passwordHash,
      credits: 3,
      creditTransactions: {
        create: {
          delta: 3,
          reason: CreditReason.SIGNUP_BONUS,
          meta: { source: "signup" },
        },
      },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      credits: true,
    },
  });

  const token = await signAuthToken({ sub: user.id, email: user.email });
  const response = NextResponse.json({ user });
  setAuthCookie(response, token);
  return response;
}
