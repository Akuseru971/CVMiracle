import Stripe from "stripe";

export const CREDIT_PACKS = {
  pack_5: { label: "5 crédits", credits: 5, priceCents: 900 },
  pack_10: { label: "10 crédits", credits: 10, priceCents: 1500 },
  pack_25: { label: "25 crédits", credits: 25, priceCents: 3000 },
} as const;

export type PackCode = keyof typeof CREDIT_PACKS;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }

  return new Stripe(key);
}

export function isPackCode(value: string): value is PackCode {
  return value in CREDIT_PACKS;
}
