"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ActiveLayer = {
  kind: "category" | "series";
  id: string;
} | null;

type UIContextValue = {
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  activeLayer: ActiveLayer;
  openCategory: (id: string) => void;
  openSeries: (id: string) => void;
  closeLayer: () => void;
  cartCount: number;
  addToCart: (label: string) => void;
  toast: string | null;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>(null);
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

  const openCategory = useCallback(
    (id: string) => {
      setActiveLayer({ kind: "category", id });
      lockBody(true);
    },
    [lockBody],
  );

  const openSeries = useCallback(
    (id: string) => {
      setActiveLayer({ kind: "series", id });
      lockBody(true);
    },
    [lockBody],
  );

  const closeLayer = useCallback(() => {
    setActiveLayer(null);
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
      activeLayer,
      openCategory,
      openSeries,
      closeLayer,
      cartCount,
      addToCart,
      toast,
    }),
    [
      searchOpen,
      openSearch,
      closeSearch,
      activeLayer,
      openCategory,
      openSeries,
      closeLayer,
      cartCount,
      addToCart,
      toast,
    ],
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
