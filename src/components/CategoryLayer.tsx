"use client";

import Image from "next/image";
import { categories } from "@/data/content";
import { useUI } from "@/components/ui-context";
import { ArrowRight, ChevronLeft, ChevronRight } from "@/components/icons";

const quickLinks = [
  "すべての商品を見る",
  "ベストセラー",
  "新着商品",
  "ギフトにおすすめ",
  "レシピ・インスピレーション",
];

export function CategoryLayer() {
  const { activeCategory, closeCategory } = useUI();
  const category = categories.find((c) => c.id === activeCategory);

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={category.name}>
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={closeCategory} />
      <div className="animate-panel-in absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-paper">
        {/* Top bar */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-mist px-3">
          <button onClick={closeCategory} className="press flex h-10 items-center gap-1.5 pr-2 text-ink" aria-label="戻る">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-[12px] tracking-wide">戻る</span>
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto pb-10">
          {/* Hero */}
          <div className="relative h-[280px] w-full bg-mist">
            <Image src={category.image} alt={category.labelJa} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="brand-track text-[18px] font-semibold text-paper">{category.name}</p>
              <p className="mt-1.5 text-[14px] font-medium text-paper/90">{category.labelJa}</p>
              <p className="mt-1 text-[12px] text-paper/75">{category.subtitleJa}</p>
            </div>
          </div>

          {/* Quick links */}
          <nav className="px-6 pt-6">
            {quickLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="press flex items-center justify-between border-b border-mist py-4 text-[14px] text-ink"
              >
                {link}
                <ArrowRight className="h-4 w-4 text-graphite" />
              </a>
            ))}
          </nav>

          {/* Subcategories */}
          <div className="px-6 pt-8">
            <p className="label-track text-[10px] font-medium text-graphite">サブカテゴリー</p>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {category.subcategories.map((sub) => (
                <li key={sub}>
                  <a
                    href="#"
                    className="press flex h-16 items-center justify-between bg-cloud px-4 text-[12.5px] font-medium text-ink"
                  >
                    {sub}
                    <ChevronRight className="h-4 w-4 text-silver" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 pt-8">
            <button className="press h-12 w-full bg-ink text-[13px] font-medium tracking-wide text-paper">
              {category.labelJa}の商品をすべて見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
