"use client";

import { services } from "@/data/content";
import { Reveal } from "@/components/Reveal";

export function ServiceCards() {
  return (
    <section className="bg-paper py-12" aria-label="サービス">
      <Reveal className="px-6">
        <p className="label-track text-[10px] font-medium text-graphite">OFFICIAL SHOP</p>
        <h2 className="mt-1.5 text-[19px] font-medium text-ink">公式ショップの安心</h2>
      </Reveal>

      <div className="mt-6 grid grid-cols-2 gap-3 px-6">
        {services.map((service, i) => (
          <Reveal key={service.id} as="article" delay={i * 60}>
            <div className="flex h-full flex-col border border-mist p-5">
              <span className="brand-track text-[12px] font-semibold text-metal">0{i + 1}</span>
              <h3 className="mt-3 text-[13.5px] font-medium leading-snug text-ink">{service.title}</h3>
              <p className="mt-2 text-[11.5px] leading-relaxed text-graphite">{service.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
