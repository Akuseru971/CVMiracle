"use client";

import Image from "next/image";
import { recipes } from "@/data/content";
import { Reveal } from "@/components/Reveal";
import { ArrowRight } from "@/components/icons";

export function RecipeSection() {
  return (
    <section className="bg-cloud py-12" aria-label="レシピ・インスピレーション">
      <Reveal className="flex items-end justify-between px-6">
        <div>
          <p className="label-track text-[10px] font-medium text-graphite">RECIPE & INSPIRATION</p>
          <h2 className="mt-1.5 text-[19px] font-medium text-ink">WMFでつくる、暮らし</h2>
        </div>
        <a href="#" className="press text-[11px] tracking-wide text-graphite">
          すべて見る
        </a>
      </Reveal>

      <div className="no-scrollbar snap-x-mandatory mt-6 flex gap-3.5 overflow-x-auto px-6">
        {recipes.map((recipe) => (
          <a key={recipe.id} href="#" className="press snap-start w-[260px] shrink-0">
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-mist">
              <Image src={recipe.image} alt={recipe.title} fill sizes="260px" className="object-cover" />
            </div>
            <p className="label-track mt-3 text-[9.5px] font-medium text-graphite">{recipe.tag}</p>
            <h3 className="mt-1.5 flex items-start justify-between gap-2 text-[13px] leading-snug text-ink">
              <span className="line-clamp-2">{recipe.title}</span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-graphite" />
            </h3>
          </a>
        ))}
      </div>
    </section>
  );
}
