"use client";

import { news } from "@/data/content";
import { Reveal } from "@/components/Reveal";
import { ArrowRight } from "@/components/icons";

export function NewsList() {
  return (
    <section className="bg-paper py-12" aria-label="ニュース">
      <Reveal className="px-6">
        <p className="label-track text-[10px] font-medium text-graphite">NEWS</p>
        <h2 className="mt-1.5 text-[19px] font-medium text-ink">お知らせ</h2>
      </Reveal>

      <ul className="mt-5 px-6">
        {news.map((item) => (
          <li key={item.id}>
            <a href="#" className="press flex items-start gap-3 border-b border-mist py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <time className="text-[11px] tabular-nums text-graphite">{item.date}</time>
                  <span className="label-track text-[9px] font-medium text-silver">{item.category}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-snug text-ink">{item.title}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-graphite" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
