"use client";

import { useState } from "react";
import { footerSections } from "@/data/content";
import { PlusIcon } from "@/components/icons";

export function MobileFooter() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <footer className="bg-ink pb-28 pt-12 text-paper">
      <div className="px-6">
        <span className="brand-track text-[24px] font-bold">WMF</span>
        <p className="mt-3 max-w-[280px] text-[11.5px] leading-relaxed text-paper/60">
          1853年より続く、ドイツNo.1キッチン＆テーブルウェアブランド。
        </p>
      </div>

      <div className="mt-8">
        {footerSections.map((section) => {
          const isOpen = open === section.id;
          return (
            <div key={section.id} className="border-t border-paper/12">
              <button
                onClick={() => setOpen(isOpen ? null : section.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-[13px] font-medium">{section.title}</span>
                <PlusIcon
                  className={`h-4 w-4 text-paper/70 transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                />
              </button>
              <div
                className="grid overflow-hidden transition-all duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="min-h-0">
                  <ul className="px-6 pb-5">
                    {section.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="press block py-2 text-[12.5px] text-paper/70">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
        <div className="border-t border-paper/12" />
      </div>

      <div className="mt-8 px-6">
        <p className="label-track text-[10px] font-medium text-paper/50">FOLLOW US</p>
        <div className="mt-3 flex gap-3">
          {["Instagram", "X", "Facebook", "YouTube"].map((sns) => (
            <a
              key={sns}
              href="#"
              className="press flex h-10 items-center border border-paper/20 px-4 text-[11px] tracking-wide text-paper/80"
            >
              {sns}
            </a>
          ))}
        </div>
        <p className="mt-8 text-[10.5px] text-paper/40">© WMF Japan. Mobile concept — TASTE MATTERS.</p>
      </div>
    </footer>
  );
}
