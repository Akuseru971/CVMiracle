"use client";

import Image from "next/image";
import { bestSellers, categories, searchSuggestions } from "@/data/content";
import { useUI } from "@/components/ui-context";
import { CloseIcon, SearchIcon } from "@/components/icons";

export function SearchLayer() {
  const { searchOpen, closeSearch, addToCart } = useUI();
  if (!searchOpen) return null;

  const recommended = bestSellers.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-paper" role="dialog" aria-modal="true" aria-label="検索">
      <div className="flex h-full flex-col">
        {/* Search bar */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-mist px-4">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-cloud px-4">
            <SearchIcon className="h-5 w-5 text-graphite" />
            <input
              autoFocus
              type="search"
              placeholder="商品名・キーワードで検索"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-silver"
            />
          </div>
          <button onClick={closeSearch} className="press flex h-10 items-center px-1 text-[12px] text-graphite" aria-label="閉じる">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-6">
          {/* Suggested keywords */}
          <section>
            <p className="label-track text-[10px] font-medium text-graphite">人気のキーワード</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {searchSuggestions.keywords.map((kw) => (
                <button key={kw} className="press rounded-full border border-mist px-4 py-2 text-[12px] text-ink">
                  {kw}
                </button>
              ))}
            </div>
          </section>

          {/* Recent */}
          <section className="mt-8">
            <p className="label-track text-[10px] font-medium text-graphite">最近の検索</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {searchSuggestions.recent.map((kw) => (
                <button key={kw} className="press rounded-full bg-cloud px-4 py-2 text-[12px] text-ink">
                  {kw}
                </button>
              ))}
            </div>
          </section>

          {/* Category shortcuts */}
          <section className="mt-8">
            <p className="label-track text-[10px] font-medium text-graphite">カテゴリーから探す</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {categories.slice(0, 6).map((c) => (
                <button key={c.id} className="press flex h-12 items-center justify-between bg-cloud px-4 text-[12px] font-medium text-ink">
                  {c.labelJa}
                  <span className="brand-track text-[8px] text-silver">{c.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Popular ranking */}
          <section className="mt-8">
            <p className="label-track text-[10px] font-medium text-graphite">検索ランキング</p>
            <ol className="mt-3">
              {searchSuggestions.ranking.map((kw, i) => (
                <li key={kw}>
                  <button className="press flex w-full items-center gap-3 border-b border-mist py-3 text-left">
                    <span className="brand-track w-5 text-[13px] font-semibold text-ink">{i + 1}</span>
                    <span className="text-[13px] text-ink">{kw}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {/* Recommended products */}
          <section className="mt-8 pb-6">
            <p className="label-track text-[10px] font-medium text-graphite">おすすめ商品</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {recommended.map((p) => (
                <button key={p.id} onClick={() => addToCart(p.name)} className="press text-left">
                  <div className="relative aspect-square w-full overflow-hidden bg-cloud">
                    <Image src={p.image} alt={p.name} fill sizes="160px" className="object-cover" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-ink">{p.name}</p>
                  <p className="mt-1 text-[12.5px] font-semibold text-ink">¥{p.price.toLocaleString("ja-JP")}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
