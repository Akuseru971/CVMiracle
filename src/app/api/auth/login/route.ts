import { NextResponse } from "next/server";
import { z } from "zod";
import { comparePassword, setAuthCookie, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const isValid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const token = await signAuthToken({ sub: user.id, email: user.email });
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      credits: user.credits,
    },
  });
  setAuthCookie(response, token);
  return response;
}
