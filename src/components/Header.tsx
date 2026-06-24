"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/ui-context";
import { WmfLogo } from "@/components/WmfLogo";
import { AccountIcon, CartIcon, MenuIcon, SearchIcon } from "@/components/icons";

const tapBase = "press flex h-11 w-11 items-center justify-center";

export function Header() {
  const { openSearch, cartCount, addToCart } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openCategories = () => {
    document.getElementById("category-browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onHero = !scrolled;
  const iconClass = onHero ? "text-paper" : "text-ink";
  const tapTarget = `${tapBase} ${iconClass}`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        onHero
          ? "bg-gradient-to-b from-ink/55 via-ink/20 to-transparent backdrop-blur-[2px]"
          : "bg-paper/92 backdrop-blur-md shadow-[0_1px_0_rgba(83,86,90,0.12)]"
      }`}
    >
      <div className="mx-auto flex h-[3.75rem] max-w-[480px] items-center justify-between px-4">
        <a href="#top" className="wmf-logo-zone press flex shrink-0 items-center" aria-label="WMF ホーム">
          <WmfLogo variant={onHero ? "white" : "black"} height={20} />
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
              <span
                className={`absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none ${
                  onHero ? "bg-paper text-ink" : "bg-ink text-paper"
                }`}
              >
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
