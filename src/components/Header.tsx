"use client";

import { useUI } from "@/components/ui-context";
import { WmfLogo } from "@/components/WmfLogo";
import { AccountIcon, CartIcon, MenuIcon } from "@/components/icons";

const tapTarget = "press flex h-11 w-11 items-center justify-center text-paper";

export function Header() {
  const { cartCount, addToCart } = useUI();

  const openCategories = () => {
    document.getElementById("category-browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-ink">
      <div className="mx-auto grid h-[3.75rem] max-w-[480px] grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex justify-start">
          <button onClick={openCategories} className={tapTarget} aria-label="メニュー">
            <MenuIcon className="h-[22px] w-[22px]" />
          </button>
        </div>

        <a href="#top" className="press flex items-center justify-center" aria-label="WMF ホーム">
          <WmfLogo variant="white" height={26} />
        </a>

        <div className="flex items-center justify-end">
          <button className={tapTarget} aria-label="マイページ">
            <AccountIcon className="h-[22px] w-[22px]" />
          </button>
          <button onClick={() => addToCart("商品")} className={`${tapTarget} relative`} aria-label="カート">
            <CartIcon className="h-[22px] w-[22px]" />
            {cartCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-paper px-1 text-[10px] font-semibold leading-none text-ink">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
