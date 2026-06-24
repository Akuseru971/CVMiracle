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
  ariaLabel,
  onClick,
  withRightBorder,
}: {
  image: string;
  title: string;
  ariaLabel: string;
  onClick: () => void;
  withRightBorder?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`press group grid min-h-[100px] grid-cols-[44%_minmax(0,1fr)_auto] items-stretch border-b border-mist bg-paper py-0 pl-0 pr-2 text-left ${
        withRightBorder ? "border-r border-mist" : ""
      }`}
    >
      <div className="wmf-browse-thumb">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 480px) 22vw, 110px"
          className="wmf-browse-visual object-contain object-left"
          aria-hidden
        />
      </div>
      <p className="flex min-w-0 items-center px-2 py-3 label-track text-[10px] font-semibold leading-[1.35] text-ink">
        {title}
      </p>
      <span className="flex items-center pr-1">
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-metal opacity-50"
          aria-hidden
        />
      </span>
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
          title={item.name}
          ariaLabel={`${item.name} — ${item.labelJa}`}
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
          ariaLabel={item.name}
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
            activeTab === "categories" ? "bg-ink text-paper" : "bg-paper text-graphite"
          }`}
        >
          カテゴリーから探す
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("series")}
          className={`press min-h-[52px] border-l border-mist px-3 py-3.5 text-[12px] font-medium leading-snug transition-colors duration-300 ${
            activeTab === "series" ? "bg-ink text-paper" : "bg-paper text-graphite"
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
