"use client";

import Image from "next/image";
import { getBestSellersForLayer, getLayerDetail } from "@/data/content";
import { useUI } from "@/components/ui-context";
import { ArrowRight, ChevronLeft, ChevronRight } from "@/components/icons";

export function CategoryLayer() {
  const { activeLayer, closeLayer, addToCart } = useUI();
  if (!activeLayer) return null;

  const detail = getLayerDetail(activeLayer.id);
  if (!detail) return null;

  const relatedProducts = getBestSellersForLayer(activeLayer.id);
  const isSeries = detail.kind === "series";
  const ctaLabel = `${detail.labelJa}の商品をすべて見る`;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={detail.labelJa}
    >
      <div className="absolute inset-0 animate-fade-in bg-steel-deep/50" onClick={closeLayer} />
      <div className="animate-panel-in absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-paper">
        <div className="flex h-[3.75rem] shrink-0 items-center gap-2 border-b border-mist px-3">
          <button
            onClick={closeLayer}
            className="press flex h-10 items-center gap-1.5 pr-2 text-signature"
            aria-label="戻る"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-[12px] tracking-wide">戻る</span>
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto pb-10">
          <div className="relative aspect-[3/2] w-full bg-signature">
            <Image
              src={detail.image}
              alt={detail.labelJa}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="wmf-overlay-editorial absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              {detail.nameLatin && (
                <p className="brand-track text-[17px] font-semibold text-paper">{detail.nameLatin}</p>
              )}
              <p className="mt-1.5 text-[14px] font-medium text-paper/90">{detail.labelJa}</p>
              <p className="copy-body mt-1 text-[12px] text-paper/75">{detail.subtitleJa}</p>
            </div>
          </div>

          <div className="px-6 pt-8">
            <p className="label-track text-[10px] font-medium text-steel">
              {isSeries ? "シリーズラインアップ" : "サブカテゴリー"}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {detail.subcategories.map((sub) => (
                <li key={sub}>
                  <button
                    type="button"
                    className="press flex h-16 w-full items-center justify-between border border-mist bg-cloud px-4 text-left text-[12.5px] font-medium text-ink"
                  >
                    {sub}
                    <ChevronRight className="h-4 w-4 shrink-0 text-metal" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 pt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="label-track text-[10px] font-medium text-steel">BEST SELLERS</p>
                <h3 className="mt-1 text-[15px] font-medium text-ink">人気商品</h3>
              </div>
              <a href="#best-sellers" onClick={closeLayer} className="press text-[11px] text-steel">
                すべて見る
              </a>
            </div>
            <div className="space-y-3">
              {relatedProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product.name)}
                  className="press flex w-full items-center gap-3 border border-mist bg-paper p-3 text-left"
                >
                  <div className="wmf-product-stage relative h-16 w-16 shrink-0 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="product-name line-clamp-2 text-[12px] text-ink">{product.name}</p>
                    <p className="mt-1 text-[13px] font-semibold text-ink">
                      ¥{product.price.toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-metal" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pt-8">
            <button
              type="button"
              className="press h-12 w-full bg-signature text-[13px] font-medium tracking-wide text-paper"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
