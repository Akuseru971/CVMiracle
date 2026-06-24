"use client";

import Image from "next/image";
import { heroSlides } from "@/data/content";
import { useCarousel } from "@/hooks/useCarousel";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export function HeroSlider() {
  const { ref, active, next, prev, goTo } = useCarousel<HTMLDivElement>({
    count: heroSlides.length,
    autoPlay: true,
    interval: 6000,
  });

  return (
    <section className="relative bg-steel-deep" aria-label="ヒーロー">
      <div ref={ref} className="no-scrollbar snap-x-mandatory flex overflow-x-auto">
        {heroSlides.map((slide, i) => (
          <div key={slide.id} className="snap-start relative h-[78vh] max-h-[640px] w-full shrink-0">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-[center_35%]"
            />
            <div className="wmf-overlay-hero absolute inset-0" />

            <div className="absolute inset-x-0 bottom-0 px-6 pb-16 pt-24">
              <p className="label-track text-[10px] font-medium text-steel-mist">{slide.eyebrow}</p>
              <h1 className="claim-track mt-3 max-w-[320px] text-[26px] font-medium leading-[1.35] text-paper">
                {slide.title}
              </h1>
              <p className="copy-body mt-3 max-w-[300px] text-[13px] text-paper/85">{slide.subtitle}</p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button className="press h-12 w-full bg-paper text-[13px] font-medium tracking-wide text-ink">
                  {slide.primaryCta}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("best-sellers")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="press h-12 w-full border border-paper/60 text-[13px] font-medium tracking-wide text-paper"
                >
                  {slide.secondaryCta}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={prev}
        aria-label="前へ"
        className="press absolute left-3 top-[42%] flex h-10 w-10 items-center justify-center rounded-full border border-paper/30 bg-ink/25 text-paper backdrop-blur-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="次へ"
        className="press absolute right-3 top-[42%] flex h-10 w-10 items-center justify-center rounded-full border border-paper/30 bg-ink/25 text-paper backdrop-blur-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => goTo(i)}
            aria-label={`スライド ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              active === i ? "w-6 bg-accent-warm" : "w-1.5 bg-paper/45"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
