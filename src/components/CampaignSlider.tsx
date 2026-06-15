"use client";

import Image from "next/image";
import { campaignSlides } from "@/data/content";
import { useCarousel } from "@/hooks/useCarousel";
import { Reveal } from "@/components/Reveal";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export function CampaignSlider() {
  const { ref, active, next, prev, goTo } = useCarousel<HTMLDivElement>({
    count: campaignSlides.length,
    autoPlay: true,
    interval: 6500,
  });

  return (
    <section className="bg-cloud py-12" aria-label="キャンペーン">
      <Reveal className="px-6">
        <h2 className="label-track text-[12px] font-semibold text-ink">CAMPAIGN</h2>
      </Reveal>

      <div ref={ref} className="no-scrollbar snap-x-mandatory mt-5 flex overflow-x-auto px-6">
        {campaignSlides.map((slide) => (
          <div key={slide.id} className="snap-start w-[calc(100%-1rem)] shrink-0 pr-4">
            <div className="relative h-[420px] w-full overflow-hidden bg-mist">
              <Image src={slide.image} alt={slide.title} fill sizes="92vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
              {slide.sale && (
                <span className="absolute left-4 top-4 bg-sale px-2.5 py-1 text-[10px] font-semibold tracking-wider text-paper">
                  SALE
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="label-track text-[10px] font-medium text-paper/80">{slide.eyebrow}</p>
                <h3 className="mt-2 text-[22px] font-medium leading-snug text-paper">{slide.title}</h3>
                <p className="mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-paper/85">{slide.body}</p>
                <button className="press mt-5 h-11 bg-paper px-6 text-[12.5px] font-medium tracking-wide text-ink">
                  {slide.cta}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between px-6">
        <div className="flex gap-1.5">
          {campaignSlides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              aria-label={`キャンペーン ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === i ? "w-5 bg-ink" : "w-1.5 bg-metal"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={prev} aria-label="前へ" className="press flex h-10 w-10 items-center justify-center rounded-full border border-mist text-ink">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} aria-label="次へ" className="press flex h-10 w-10 items-center justify-center rounded-full border border-mist text-ink">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
