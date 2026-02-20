import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80",
        className,
      )}
      {...props}
    />
  );
}
