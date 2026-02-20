import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth non configuré" }, { status: 400 });
  }

  const { idToken } = await request.json();
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "idToken requis" }, { status: 400 });
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();

  const email = payload?.email?.toLowerCase();
  const googleId = payload?.sub;
  const fullName = payload?.name;

  if (!email || !googleId) {
    return NextResponse.json({ error: "Token Google invalide" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { googleId, fullName: fullName ?? undefined },
    create: {
      email,
      googleId,
      fullName: fullName ?? undefined,
      credits: 3,
      creditTransactions: {
        create: {
          delta: 3,
          reason: "SIGNUP_BONUS",
          meta: { source: "google_signup" },
        },
      },
    },
  });

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
