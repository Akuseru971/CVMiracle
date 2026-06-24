"use client";

import Image from "next/image";
import { categories } from "@/data/content";
import { useCarousel } from "@/hooks/useCarousel";
import { useUI } from "@/components/ui-context";
import { Reveal } from "@/components/Reveal";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export function TasteMattersSection() {
  const { ref, active, next, prev, goTo } = useCarousel<HTMLDivElement>({
    count: categories.length,
  });
  const { openCategory } = useUI();

  return (
    <section id="taste-matters" className="bg-paper py-14" aria-label="TASTE MATTERS">
      <Reveal className="px-6">
        <p className="label-track text-[10px] font-medium text-steel">SINCE 1853</p>
        <h2 className="brand-track mt-2 text-[24px] font-semibold leading-none text-ink">TASTE MATTERS</h2>
        <p className="copy-body mt-3 max-w-[300px] text-[12.5px] text-graphite">
          カテゴリーから探す。ドイツの哲学が息づく、上質なキッチンの道具たち。
        </p>
      </Reveal>

      <div
        ref={ref}
        className="no-scrollbar snap-x-mandatory mt-8 flex gap-3 overflow-x-auto px-6 pb-1"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => openCategory(category.id)}
            className="press snap-start group relative aspect-[2/3] h-[420px] w-[252px] shrink-0 overflow-hidden bg-signature text-left"
            aria-label={`${category.name} を開く`}
          >
            <Image
              src={category.image}
              alt={category.labelJa}
              fill
              sizes="252px"
              className="wmf-category-visual object-cover object-center transition-transform duration-700 group-active:scale-[1.02]"
            />
            <div className="wmf-overlay-category absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="brand-track text-[13px] font-semibold leading-snug text-paper">
                {category.name}
              </p>
              <p className="mt-2 text-[13px] font-normal text-paper/90">{category.labelJa}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] tracking-[0.12em] text-steel-mist">
                見る
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between px-6">
        <div className="flex gap-1.5">
          {categories.map((category, i) => (
            <button
              key={category.id}
              onClick={() => goTo(i)}
              aria-label={`${category.name} へ`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === i ? "w-5 bg-signature" : "w-1.5 bg-metal"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={prev}
            aria-label="前へ"
            className="press flex h-10 w-10 items-center justify-center rounded-full border border-mist text-ink"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="次へ"
            className="press flex h-10 w-10 items-center justify-center rounded-full border border-mist text-ink"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
