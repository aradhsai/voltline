"use client";

import type { DivisionId } from "@/lib/data";
import { motion } from "framer-motion";

export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`rounded-xl border border-ring-1 bg-surface p-4 md:p-5 ${className}`}
    >
      {(title || right) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-display text-[14.5px] font-semibold tracking-wide">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[11.5px] text-muted">{subtitle}</p>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function StatTile({
  label,
  value,
  unit,
  sub,
  accent = "var(--ink)",
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className="font-display text-[26px] font-bold leading-none md:text-[30px]"
          style={{ color: accent }}
        >
          {value}
        </span>
        {unit && <span className="text-[12.5px] text-ink-2">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-[11.5px] text-muted">{sub}</div>}
    </div>
  );
}

interface VTooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

/** Recharts tooltip themed for the dark surface. */
export function VTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: VTooltipEntry[];
  label?: string | number;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ring-1 bg-surface-2 px-3 py-2 text-[12px] shadow-xl">
      {label !== undefined && (
        <div className="mb-1 font-semibold text-ink">{label}</div>
      )}
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-[2px]"
            style={{ background: p.color }}
          />
          <span className="text-ink-2">{p.name}</span>
          <span className="readout ml-auto pl-3 font-medium text-ink">
            {formatter
              ? formatter(Number(p.value), String(p.name))
              : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export const AXIS = {
  tick: { fill: "var(--muted)", fontSize: 11 },
  axisLine: { stroke: "var(--baseline)" },
  tickLine: false as const,
};

export const GRID = {
  stroke: "var(--grid)",
  strokeDasharray: "0",
  vertical: false as const,
};

export const DIV_COLOR: Record<DivisionId, string> = {
  cable: "var(--series-1)",
  crt: "var(--series-2)",
  bsw: "var(--series-3)",
  swg: "var(--series-4)",
  picc: "var(--series-5)",
};
