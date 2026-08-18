"use client";

import { useState } from "react";
import {
  LINES,
  daySummary,
  type DaySummary,
} from "@/lib/data";
import { DIV_COLOR } from "@/components/ui";
import { fmt, fmtLength } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { Card, StatTile } from "@/components/ui";

const RANGES = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "14d", label: "Last 14 days", days: 14 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "mtd", label: "Month to date", days: 0 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function rangeDays(key: RangeKey, now: Date): DaySummary[] {
  const out: DaySummary[] = [];
  const n =
    key === "mtd"
      ? now.getDate() - 1
      : RANGES.find((r) => r.key === key)!.days;
  for (let i = Math.max(n, 1); i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(daySummary(d));
  }
  return out;
}

export default function ReportsPage() {
  const now = useNow(60000);
  const [range, setRange] = useState<RangeKey>("7d");
  if (!now) return <Skeleton />;

  const days = rangeDays(range, now);
  const energy = days.reduce((s, d) => s + d.energyKwh, 0);
  const production = days.reduce((s, d) => s + d.productionM, 0);
  const cost = days.reduce((s, d) => s + d.costAed, 0);
  const carbon = days.reduce((s, d) => s + d.carbonKg, 0);
  const sec = production > 0 ? energy / (production / 1000) : 0;

  const perLine = LINES.map((l) => ({
    line: l,
    energy: days.reduce((s, d) => s + d.perLine[l.id].energyKwh, 0),
    production: days.reduce((s, d) => s + d.perLine[l.id].productionM, 0),
  })).sort((a, b) => b.energy - a.energy);
  const maxLineEnergy = Math.max(...perLine.map((p) => p.energy), 1);

  function exportCsv() {
    const header =
      "date,production_m,energy_kwh,sec_kwh_per_km,avg_pf,carbon_kg,cost_aed";
    const rows = days.map(
      (d) =>
        `${d.date},${d.productionM},${d.energyKwh},${d.secKwhPerKm},${d.avgPf},${d.carbonKg},${d.costAed}`
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voltline-report-${days[0]?.date}-to-${days[days.length - 1]?.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* range picker + export */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-lg border px-3.5 py-2 text-[12.5px] transition-colors ${
              range === r.key
                ? "border-copper bg-surface font-semibold text-copper"
                : "border-ring-1 bg-surface text-ink-2 hover:text-ink"
            }`}
          >
            {range === r.key && <span className="mr-1.5">✓</span>}
            {r.label}
          </button>
        ))}
        <button
          onClick={exportCsv}
          className="ml-auto rounded-lg bg-copper px-4 py-2 text-[12.5px] font-semibold text-page transition-opacity hover:opacity-90"
        >
          Export CSV
        </button>
      </div>

      {/* range summary */}
      <Card>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            label="Energy"
            value={fmt(energy)}
            unit="kWh"
            accent="var(--copper)"
          />
          <StatTile
            label="Production"
            value={fmtLength(production).split(" ")[0]}
            unit={fmtLength(production).split(" ")[1]}
          />
          <StatTile label="Specific energy" value={fmt(sec, 1)} unit="kWh/km" />
          <StatTile label="Carbon" value={fmt(carbon / 1000, 2)} unit="t CO₂e" />
          <StatTile label="Cost" value={fmt(cost)} unit="AED" />
        </div>
      </Card>

      {/* per-line breakdown */}
      <Card
        title="Per-machine breakdown — all 30 meters"
        subtitle="Energy share across the range, largest first; production alongside where the machine makes cable"
      >
        <div className="flex flex-col gap-3">
          {perLine.map((p) => (
            <div key={p.line.id} className="grid grid-cols-[150px_1fr_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold">{p.line.name}</div>
                <div className="truncate text-[10.5px] text-muted">
                  {p.line.machine} · {p.line.loop}
                </div>
              </div>
              <div className="h-3.5 overflow-hidden rounded-[4px] bg-surface-2">
                <div
                  className="h-full rounded-[4px]"
                  style={{
                    width: `${Math.max(1, (p.energy / maxLineEnergy) * 100)}%`,
                    background: DIV_COLOR[p.line.division],
                  }}
                />
              </div>
              <div className="readout w-[190px] text-right text-[12.5px]">
                <span className="font-semibold">{fmt(p.energy)}</span>
                <span className="text-muted"> kWh</span>
                <span className="ml-3 text-ink-2">
                  {p.production > 0 ? fmtLength(p.production) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* daily table */}
      <Card
        title="Daily report"
        subtitle={`${days.length} days · totals in the footer row`}
      >
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[680px] text-[12.5px]">
            <thead>
              <tr className="border-b border-ring-1 text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 text-right font-medium">Production</th>
                <th className="py-2 pr-4 text-right font-medium">Energy kWh</th>
                <th className="py-2 pr-4 text-right font-medium">kWh/km</th>
                <th className="py-2 pr-4 text-right font-medium">Avg PF</th>
                <th className="py-2 pr-4 text-right font-medium">CO₂e kg</th>
                <th className="py-2 text-right font-medium">Cost AED</th>
              </tr>
            </thead>
            <tbody className="readout">
              {days.map((d) => (
                <tr key={d.date} className="border-b border-ring-1/60">
                  <td className="py-2 pr-4 font-sans text-ink-2">
                    {d.date}{" "}
                    <span className="text-muted">({d.label.split(" ")[0]})</span>
                  </td>
                  <td className="py-2 pr-4 text-right">{fmtLength(d.productionM)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(d.energyKwh)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(d.secKwhPerKm, 1)}</td>
                  <td className="py-2 pr-4 text-right">{d.avgPf.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(d.carbonKg)}</td>
                  <td className="py-2 text-right">{fmt(d.costAed)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="readout">
              <tr className="text-copper">
                <td className="py-2.5 pr-4 font-sans font-semibold">Total</td>
                <td className="py-2.5 pr-4 text-right font-semibold">
                  {fmtLength(production)}
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold">{fmt(energy)}</td>
                <td className="py-2.5 pr-4 text-right font-semibold">{fmt(sec, 1)}</td>
                <td className="py-2.5 pr-4 text-right text-muted">—</td>
                <td className="py-2.5 pr-4 text-right font-semibold">{fmt(carbon)}</td>
                <td className="py-2.5 text-right font-semibold">{fmt(cost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {[44, 100, 220, 380].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-ring-1 bg-surface"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
