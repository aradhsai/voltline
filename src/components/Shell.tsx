"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fmtClock, fmtDateLong } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard", glyph: "▦" },
  { href: "/process", label: "Process", glyph: "∿" },
  { href: "/reports", label: "Reports", glyph: "≣" },
  { href: "/trends", label: "Trends", glyph: "⟋" },
];

function WaveMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <rect width="26" height="26" rx="6" fill="var(--copper)" />
      <path
        d="M4 13 L8 13 L10 6.5 L13 19.5 L16 9 L18 13 L22 13"
        fill="none"
        stroke="#0d0d0d"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-ring-1 bg-surface md:flex">
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
          <WaveMark />
          <div>
            <div className="font-display text-[17px] font-bold tracking-wide">
              VOLTLINE
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
              Energy automation
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
                  active
                    ? "bg-surface-2 font-semibold text-copper"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span
                  className={`w-4 text-center text-[15px] ${active ? "text-copper" : "text-muted"}`}
                  aria-hidden
                >
                  {item.glyph}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-5 pb-6">
          <div className="rounded-lg border border-ring-1 bg-surface-2 px-3.5 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted">
              Site
            </div>
            <div className="mt-0.5 text-[13px] font-medium">
              Northwind Cable Works
            </div>
            <div className="text-[11.5px] text-muted">Rotterdam · Hall B</div>
          </div>
          <div className="mt-4 text-[10.5px] leading-relaxed text-muted">
            4 meters on Modbus TCP
            <br />
            Poll interval 2 s
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ring-1 bg-page/85 px-5 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <WaveMark />
            <nav className="flex gap-3 text-[13px]">
              {NAV.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className={
                    pathname === i.href ? "font-semibold text-copper" : "text-ink-2"
                  }
                >
                  {i.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-2.5 md:flex">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-good" />
            <span className="text-[13px] text-ink-2">
              All meters reporting
            </span>
          </div>
          <div className="readout flex items-baseline gap-3 text-[13px] text-ink-2">
            {now && (
              <>
                <span className="hidden sm:inline">{fmtDateLong(now)}</span>
                <span className="text-[15px] font-semibold text-ink">
                  {fmtClock(now)}
                </span>
              </>
            )}
          </div>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6 md:px-8">{children}</main>
        <footer className="border-t border-ring-1 px-5 py-4 text-[11px] text-muted md:px-8">
          Voltline demo — simulated plant data, deterministic seed. Not a real
          site.
        </footer>
      </div>
    </div>
  );
}
