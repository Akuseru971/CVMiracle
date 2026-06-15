"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type UIContextValue = {
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  activeCategory: string | null;
  openCategory: (id: string) => void;
  closeCategory: () => void;
  cartCount: number;
  addToCart: (label: string) => void;
  toast: string | null;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const lockBody = useCallback((locked: boolean) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = locked ? "hidden" : "";
    }
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    lockBody(true);
  }, [lockBody]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    lockBody(false);
  }, [lockBody]);

  const openCategory = useCallback((id: string) => {
    setActiveCategory(id);
    lockBody(true);
  }, [lockBody]);

  const closeCategory = useCallback(() => {
    setActiveCategory(null);
    lockBody(false);
  }, [lockBody]);

  const addToCart = useCallback((label: string) => {
    setCartCount((c) => c + 1);
    setToast(`${label} をカートに追加しました`);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const value = useMemo(
    () => ({
      searchOpen,
      openSearch,
      closeSearch,
      activeCategory,
      openCategory,
      closeCategory,
      cartCount,
      addToCart,
      toast,
    }),
    [searchOpen, openSearch, closeSearch, activeCategory, openCategory, closeCategory, cartCount, addToCart, toast],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within UIProvider");
  }
  return ctx;
}
