"use client";

import { useUI } from "@/components/ui-context";
import { CartIcon, GridIcon, HeartIcon, HomeIcon, SearchIcon } from "@/components/icons";

export function BottomNavigation() {
  const { openSearch, openCategory, cartCount, addToCart } = useUI();

  const items = [
    { id: "home", label: "ホーム", icon: HomeIcon, action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { id: "category", label: "カテゴリー", icon: GridIcon, action: () => openCategory("pots") },
    { id: "search", label: "検索", icon: SearchIcon, action: openSearch },
    { id: "wishlist", label: "お気に入り", icon: HeartIcon, action: () => {} },
    { id: "cart", label: "カート", icon: CartIcon, action: () => addToCart("商品"), badge: cartCount },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-paper/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-[480px] grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="press relative flex flex-col items-center gap-1 py-2.5 text-graphite"
              aria-label={item.label}
            >
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" />
                {item.badge ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-semibold leading-none text-paper">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[9.5px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
