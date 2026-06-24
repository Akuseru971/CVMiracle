"use client";

import { useState } from "react";
import Image from "next/image";
import { browseCategories, seriesCollections } from "@/data/content";
import type { BrowseItem, SeriesCollection } from "@/data/content";
import { useUI } from "@/components/ui-context";
import { Reveal } from "@/components/Reveal";
import { ChevronRight } from "@/components/icons";

type Tab = "categories" | "series";

function GridItem({
  image,
  title,
  subtitle,
  onClick,
  withRightBorder,
}: {
  image: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  withRightBorder?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press flex min-h-[88px] items-center gap-3 border-b border-mist px-4 py-4 text-left ${
        withRightBorder ? "border-r border-mist" : ""
      }`}
    >
      <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden bg-cloud">
        <Image src={image} alt="" fill sizes="52px" className="object-contain p-1" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug text-ink">{title}</p>
        <p className="copy-body mt-1 line-clamp-2 text-[11px] text-silver">{subtitle}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-metal" aria-hidden />
    </button>
  );
}

function CategoryGrid({
  items,
  onSelect,
}: {
  items: BrowseItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 bg-paper">
      {items.map((item, index) => (
        <GridItem
          key={item.id}
          image={item.image}
          title={item.labelJa}
          subtitle={item.subtitleJa}
          onClick={() => onSelect(item.id)}
          withRightBorder={index % 2 === 0}
        />
      ))}
    </div>
  );
}

function SeriesGrid({
  items,
  onSelect,
}: {
  items: SeriesCollection[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 bg-paper">
      {items.map((item, index) => (
        <GridItem
          key={item.id}
          image={item.image}
          title={item.name}
          subtitle={item.subtitleJa}
          onClick={() => onSelect(item.id)}
          withRightBorder={index % 2 === 0}
        />
      ))}
    </div>
  );
}

export function CategoryBrowseSection() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const { openCategory, openSeries } = useUI();

  return (
    <section id="category-browse" className="bg-cloud pb-2" aria-label="商品を探す">
      <Reveal className="px-6 pt-12">
        <p className="label-track text-[10px] font-medium text-ink">SHOP BY</p>
        <h2 className="mt-2 text-[20px] font-medium tracking-tight text-ink">商品を探す</h2>
        <p className="copy-body mt-2 max-w-[320px] text-[12.5px] text-graphite">
          カテゴリーまたはシリーズ・ブランドから、WMFの商品をお選びください。
        </p>
      </Reveal>

      <div className="sticky top-[3.75rem] z-30 mt-7 grid grid-cols-2 border-y border-mist bg-paper/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`press min-h-[52px] px-3 py-3.5 text-[12px] font-medium leading-snug transition-colors duration-300 ${
            activeTab === "categories" ? "bg-signature text-paper" : "bg-paper text-graphite"
          }`}
        >
          カテゴリーから探す
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("series")}
          className={`press min-h-[52px] border-l border-mist px-3 py-3.5 text-[12px] font-medium leading-snug transition-colors duration-300 ${
            activeTab === "series" ? "bg-signature text-paper" : "bg-paper text-graphite"
          }`}
        >
          シリーズ・ブランドから探す
        </button>
      </div>

      <div
        key={activeTab}
        className="animate-fade-in border-b border-mist"
        role="tabpanel"
        aria-label={activeTab === "categories" ? "カテゴリーから探す" : "シリーズ・ブランドから探す"}
      >
        {activeTab === "categories" ? (
          <CategoryGrid items={browseCategories} onSelect={openCategory} />
        ) : (
          <SeriesGrid items={seriesCollections} onSelect={openSeries} />
        )}
      </div>
    </section>
  );
}
