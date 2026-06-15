"use client";

import Image from "next/image";
import { Reveal } from "@/components/Reveal";

const chips = ["美しい発色", "優れた耐久性", "毎日の料理に"];

export function FusiontecStory() {
  return (
    <section className="relative overflow-hidden bg-ink" aria-label="フュージョンテック ミネラル">
      <div className="relative h-[300px] w-full">
        <Image
          src="/images/brand/fusiontec.jpg"
          alt="フュージョンテック ミネラル"
          fill
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      </div>

      <Reveal className="px-6 pb-14 pt-2">
        <p className="label-track text-[10px] font-medium text-silver">FUSIONTEC MINERAL</p>
        <h2 className="mt-3 text-[22px] font-medium leading-relaxed text-paper">
          天然鉱石から生まれた、上質な調理体験。
        </h2>
        <p className="mt-4 text-[13px] leading-relaxed text-paper/70">
          美しさ、耐久性、使いやすさを兼ね備えたWMFを代表するプレミアムシリーズ。
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-paper/25 px-4 py-2 text-[11.5px] tracking-wide text-paper/90"
            >
              {chip}
            </span>
          ))}
        </div>

        <button className="press mt-8 h-12 w-full bg-paper text-[13px] font-medium tracking-wide text-ink">
          シリーズを見る
        </button>
      </Reveal>
    </section>
  );
}
