import { CreditReason, PurchaseStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CREDIT_PACKS, getStripe, isPackCode } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const checkoutId = session.id;
    const userId = session.metadata?.userId;
    const packCode = session.metadata?.packCode;

    if (!userId || !packCode || !isPackCode(packCode)) {
      return NextResponse.json({ error: "Metadata incomplète" }, { status: 400 });
    }

    const pack = CREDIT_PACKS[packCode];

    await prisma.$transaction(async (tx) => {
      const exists = await tx.purchase.findUnique({
        where: { stripeCheckoutId: checkoutId },
      });

      if (exists?.status === PurchaseStatus.COMPLETED) {
        return;
      }

      await tx.purchase.upsert({
        where: { stripeCheckoutId: checkoutId },
        update: {
          status: PurchaseStatus.COMPLETED,
          stripePaymentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined,
        },
        create: {
          stripeCheckoutId: checkoutId,
          stripePaymentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined,
          userId,
          packCode,
          creditsPurchased: pack.credits,
          amountCents: pack.priceCents,
          status: PurchaseStatus.COMPLETED,
        },
      });

      if (!exists) {
        await tx.user.update({
          where: { id: userId },
          data: { credits: { increment: pack.credits } },
        });

        await tx.creditTransaction.create({
          data: {
            userId,
            delta: pack.credits,
            reason: CreditReason.STRIPE_PURCHASE,
            meta: { checkoutId, packCode },
          },
        });
      }
    });
  }

  return NextResponse.json({ received: true });
}
