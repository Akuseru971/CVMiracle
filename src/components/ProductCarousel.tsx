"use client";

import Image from "next/image";
import type { Product } from "@/data/content";
import { useCarousel } from "@/hooks/useCarousel";
import { useUI } from "@/components/ui-context";
import { Reveal } from "@/components/Reveal";
import { ChevronLeft, ChevronRight } from "@/components/icons";

type Props = {
  eyebrow: string;
  title: string;
  products: Product[];
  showRanking?: boolean;
  tone?: "light" | "muted";
};

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export function ProductCarousel({ eyebrow, title, products, showRanking = false, tone = "light" }: Props) {
  const { ref, active, next, prev, goTo } = useCarousel<HTMLDivElement>({ count: products.length });
  const { addToCart } = useUI();

  return (
    <section className={`${tone === "muted" ? "bg-cloud" : "bg-paper"} py-12`} aria-label={title}>
      <Reveal className="flex items-end justify-between px-6">
        <div>
          <p className="label-track text-[10px] font-medium text-graphite">{eyebrow}</p>
          <h2 className="mt-1.5 text-[19px] font-medium text-ink">{title}</h2>
        </div>
        <a href="#" className="press text-[11px] tracking-wide text-graphite">
          すべて見る
        </a>
      </Reveal>

      <div ref={ref} className="no-scrollbar snap-x-mandatory mt-6 flex gap-3.5 overflow-x-auto px-6">
        {products.map((product, i) => (
          <article key={product.id} className="snap-start w-[200px] shrink-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper">
              <Image src={product.image} alt={product.name} fill sizes="200px" className="object-cover" />
              {showRanking && (
                <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center bg-ink text-[13px] font-semibold text-paper">
                  {i + 1}
                </span>
              )}
              {product.badge && (
                <span
                  className={`absolute right-2 top-2 px-2 py-0.5 text-[9.5px] font-medium tracking-wide ${
                    product.sale ? "bg-sale text-paper" : "bg-paper/90 text-ink"
                  }`}
                >
                  {product.badge}
                </span>
              )}
            </div>
            <h3 className="mt-3 line-clamp-2 min-h-[2.6em] text-[12.5px] leading-snug text-ink">
              {product.name}
            </h3>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-[14px] font-semibold text-ink">{yen(product.price)}</span>
              {product.oldPrice && (
                <span className="text-[11px] text-silver line-through">{yen(product.oldPrice)}</span>
              )}
            </div>
            <button
              onClick={() => addToCart(product.name)}
              className="press mt-3 h-10 w-full border border-ink text-[12px] font-medium tracking-wide text-ink"
            >
              商品を見る
            </button>
          </article>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between px-6">
        <div className="flex flex-wrap gap-1.5">
          {products.map((product, i) => (
            <button
              key={product.id}
              onClick={() => goTo(i)}
              aria-label={`商品 ${i + 1}`}
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
