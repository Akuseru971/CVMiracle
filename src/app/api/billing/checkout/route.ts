import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { CREDIT_PACKS, getStripe, isPackCode } from "@/lib/stripe";

const schema = z.object({
  packCode: z.string(),
});

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isPackCode(parsed.data.packCode)) {
    return NextResponse.json({ error: "Pack invalide" }, { status: 400 });
  }

  const pack = CREDIT_PACKS[parsed.data.packCode];
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${process.env.APP_URL}/dashboard?billing=success`,
    cancel_url: `${process.env.APP_URL}/dashboard?billing=cancel`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          product_data: {
            name: `CVMiracle - ${pack.label}`,
          },
          unit_amount: pack.priceCents,
        },
      },
    ],
    metadata: {
      userId: user.id,
      packCode: parsed.data.packCode,
      credits: String(pack.credits),
    },
  });

  return NextResponse.json({ url: session.url });
}
