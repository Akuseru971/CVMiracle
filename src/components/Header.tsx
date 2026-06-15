"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/ui-context";
import { AccountIcon, CartIcon, MenuIcon, SearchIcon } from "@/components/icons";

export function Header() {
  const { openSearch, cartCount, addToCart } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-paper/85 backdrop-blur-md shadow-[0_1px_0_rgba(17,19,21,0.08)]"
          : "bg-paper/95"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[480px] items-center justify-between px-4">
        <button className="press -ml-1 flex h-9 w-9 items-center justify-center text-ink" aria-label="メニュー">
          <MenuIcon className="h-6 w-6" />
        </button>

        <a href="#top" className="select-none" aria-label="WMF ホーム">
          <span className="brand-track text-[22px] font-bold leading-none text-ink">WMF</span>
        </a>

        <div className="flex items-center gap-1">
          <button onClick={openSearch} className="press flex h-9 w-9 items-center justify-center text-ink" aria-label="検索">
            <SearchIcon className="h-[22px] w-[22px]" />
          </button>
          <button className="press flex h-9 w-9 items-center justify-center text-ink" aria-label="マイページ">
            <AccountIcon className="h-[22px] w-[22px]" />
          </button>
          <button
            onClick={() => addToCart("商品")}
            className="press relative flex h-9 w-9 items-center justify-center text-ink"
            aria-label="カート"
          >
            <CartIcon className="h-[22px] w-[22px]" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold leading-none text-paper">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
