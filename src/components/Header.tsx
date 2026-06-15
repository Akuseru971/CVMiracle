"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/ui-context";
import { AccountIcon, CartIcon, MenuIcon, SearchIcon } from "@/components/icons";

const tapTarget = "press flex h-11 w-11 items-center justify-center text-ink";

export function Header() {
  const { openSearch, cartCount, addToCart } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openCategories = () => {
    document.getElementById("category-browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-paper/85 backdrop-blur-md shadow-[0_1px_0_rgba(17,19,21,0.08)]"
          : "bg-paper/95"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[480px] items-center justify-between px-3">
        <a href="#top" className="press flex shrink-0 items-center py-2 pr-2" aria-label="WMF ホーム">
          <span className="brand-track text-[22px] font-bold leading-none text-ink">WMF</span>
        </a>

        <div className="flex items-center">
          <button onClick={openSearch} className={tapTarget} aria-label="検索">
            <SearchIcon className="h-[22px] w-[22px]" />
          </button>
          <button className={tapTarget} aria-label="マイページ">
            <AccountIcon className="h-[22px] w-[22px]" />
          </button>
          <button
            onClick={() => addToCart("商品")}
            className={`${tapTarget} relative`}
            aria-label="カート"
          >
            <CartIcon className="h-[22px] w-[22px]" />
            {cartCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold leading-none text-paper">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={openCategories} className={tapTarget} aria-label="カテゴリー">
            <MenuIcon className="h-[22px] w-[22px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
