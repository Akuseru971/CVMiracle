"use client";

import Image from "next/image";
import { featureSlides } from "@/data/content";
import { useCarousel } from "@/hooks/useCarousel";
import { Reveal } from "@/components/Reveal";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export function FeatureSection() {
  const { ref, active, next, prev, goTo } = useCarousel<HTMLDivElement>({
    count: featureSlides.length,
    autoPlay: true,
    interval: 6500,
  });

  return (
    <section className="bg-cloud py-12" aria-label="特集">
      <Reveal className="px-6">
        <p className="label-track text-[10px] font-medium text-ink">WMF HIGHLIGHTS</p>
        <h2 className="mt-1.5 text-[19px] font-medium text-ink">特集</h2>
      </Reveal>

      <div ref={ref} className="no-scrollbar snap-x-mandatory mt-6 flex overflow-x-auto px-6">
        {featureSlides.map((slide) => (
          <article key={slide.id} className="snap-start w-[calc(100%-1rem)] shrink-0 pr-4">
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-signature">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="92vw"
                className="object-cover object-center"
              />
              <div className="wmf-overlay-editorial absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="label-track text-[10px] font-medium text-paper/75">{slide.eyebrow}</p>
                <h3 className="claim-track mt-2 text-[21px] font-medium leading-snug text-paper">
                  {slide.title}
                </h3>
                <p className="copy-body mt-2 max-w-[300px] text-[12.5px] text-paper/85">{slide.body}</p>
                <button className="press mt-5 h-11 border border-paper/50 px-6 text-[12.5px] font-medium tracking-wide text-paper">
                  {slide.cta}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between px-6">
        <div className="flex gap-1.5">
          {featureSlides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              aria-label={`特集 ${i + 1}`}
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
