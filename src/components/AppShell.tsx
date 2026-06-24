"use client";

import { UIProvider, useUI } from "@/components/ui-context";
import { Header } from "@/components/Header";
import { SearchLayer } from "@/components/SearchLayer";
import { CategoryLayer } from "@/components/CategoryLayer";

function Toast() {
  const { toast } = useUI();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-6 pb-[env(safe-area-inset-bottom)]">
      <div className="animate-fade-in rounded-full bg-signature px-5 py-3 text-[12px] font-medium text-paper shadow-lg">
        {toast}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <Header />
      <main id="top" className="pt-[3.75rem]">
        {children}
      </main>
      <SearchLayer />
      <CategoryLayer />
      <Toast />
    </UIProvider>
  );
}
