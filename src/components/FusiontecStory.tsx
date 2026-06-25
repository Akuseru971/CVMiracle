"use client";

import Image from "next/image";
import { Reveal } from "@/components/Reveal";

const chips = ["美しい発色", "優れた耐久性", "毎日の料理に"];

export function FusiontecStory() {
  return (
    <section className="relative overflow-hidden bg-ink" aria-label="フュージョンテック ミネラル">
      <div className="relative aspect-[3/2] w-full">
        <Image
          src="/images/brand/fusiontec.jpg"
          alt="フュージョンテック ミネラル"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-90"
        />
        <div className="wmf-overlay-editorial absolute inset-0" />
      </div>

      <Reveal className="px-6 pb-14 pt-4">
        <p className="label-track text-[10px] font-medium text-metal">FUSIONTEC MINERAL</p>
        <h2 className="claim-track mt-3 text-[22px] font-medium text-paper">
          天然鉱石から生まれた、上質な調理体験。
        </h2>
        <p className="copy-body mt-4 text-[13px] text-paper/75">
          美しさ、耐久性、使いやすさを兼ね備えたWMFを代表するプレミアムシリーズ。
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="border border-accent-warm/40 px-4 py-2 text-[11.5px] tracking-wide text-paper/90"
            >
              {chip}
            </span>
          ))}
        </div>

        <button className="press mt-8 h-12 w-full bg-cta-gold text-[13px] font-medium tracking-wide text-ink">
          シリーズを見る
        </button>
      </Reveal>
    </section>
  );
}
