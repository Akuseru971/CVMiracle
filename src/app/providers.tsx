"use client";

import { UIProvider } from "@/components/ui-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <UIProvider>{children}</UIProvider>;
}
