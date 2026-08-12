"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LINES, hourRecord, lastNDays } from "@/lib/data";
import { fmt } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { AXIS, Card, GRID, VTooltip } from "@/components/ui";

const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
];

// sequential blue ramp (light→dark reversed for dark surface: low = near-surface)
const HEAT = [
  "#22221f",
  "#104281",
  "#184f95",
  "#1c5cab",
  "#256abf",
  "#2a78d6",
  "#3987e5",
  "#5598e7",
  "#86b6ef",
];

export default function TrendsPage() {
  const now = useNow(60000);
  if (!now) return <Skeleton />;

  const days = lastNDays(30, now);
  const tick = (v: string, i: number) => (i % 3 === 0 ? v : "");

  // day × hour heatmap of total plant energy
  const heat: { date: string; label: string; hours: number[] }[] = days
    .slice(-21)
    .map((d) => {
      const dt = new Date(`${d.date}T00:00:00`);
      const hours = Array.from({ length: 24 }, (_, h) =>
        LINES.reduce((s, l) => s + hourRecord(l, dt, h).energyKwh, 0)
      );
      return { date: d.date, label: d.label, hours };
    });
  const heatMax = Math.max(...heat.flatMap((r) => r.hours));

  const perLineDaily = days.map((d) => {
    const row: Record<string, number | string> = { label: d.label };
    for (const l of LINES) row[l.name] = d.perLine[l.id].energyKwh;
    return row;
  });

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      <Card
        title="Plant energy — 30 days"
        subtitle="Total kWh per day across all metered lines"
      >
        <div className="h-[220px]">
          <ResponsiveContainer>
            <AreaChart data={days} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="eFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} tickFormatter={tick} />
              <YAxis {...AXIS} width={56} />
              <Tooltip
                content={<VTooltip formatter={(v) => `${fmt(v)} kWh`} />}
                cursor={{ stroke: "var(--baseline)" }}
              />
              <Area
                type="monotone"
                dataKey="energyKwh"
                name="Energy"
                stroke="var(--series-1)"
                strokeWidth={2}
                fill="url(#eFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* heatmap */}
      <Card
        title="Load pattern — day × hour"
        subtitle="Hourly plant energy, last 21 days. Dark = idle, bright = heavy load; the two-shift pattern and Sunday maintenance window read directly."
      >
        <div className="overflow-x-auto scroll-thin">
          <div className="min-w-[720px]">
            <div className="mb-1 grid grid-cols-[64px_repeat(24,1fr)] gap-[2px] text-[9.5px] text-muted">
              <span />
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="text-center">
                  {h % 4 === 0 ? String(h).padStart(2, "0") : ""}
                </span>
              ))}
            </div>
            {heat.map((row) => (
              <div
                key={row.date}
                className="grid grid-cols-[64px_repeat(24,1fr)] items-center gap-[2px]"
              >
                <span className="pr-2 text-right text-[10px] text-muted">
                  {row.label}
                </span>
                {row.hours.map((v, h) => {
                  const idx = Math.min(
                    HEAT.length - 1,
                    Math.round((v / heatMax) * (HEAT.length - 1))
                  );
                  return (
                    <div
                      key={h}
                      title={`${row.date} ${String(h).padStart(2, "0")}:00 — ${fmt(v)} kWh`}
                      className="h-[16px] rounded-[3px]"
                      style={{ background: HEAT[idx] }}
                    />
                  );
                })}
              </div>
            ))}
            <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-muted">
              0 kWh
              {HEAT.map((c) => (
                <span
                  key={c}
                  className="h-[10px] w-[18px] rounded-[2px]"
                  style={{ background: c }}
                />
              ))}
              {fmt(heatMax)} kWh
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Energy per line — 30 days"
          subtitle="Daily kWh by line"
        >
          <div className="h-[230px]">
            <ResponsiveContainer>
              <LineChart data={perLineDaily} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} tickFormatter={tick} />
                <YAxis {...AXIS} width={56} />
                <Tooltip content={<VTooltip formatter={(v) => `${fmt(v)} kWh`} />} />
                {LINES.map((l, i) => (
                  <Line
                    key={l.id}
                    type="monotone"
                    dataKey={l.name}
                    stroke={SERIES[i]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {LINES.map((l, i) => (
              <span key={l.id} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                <span
                  className="inline-block h-2 w-2 rounded-[2px]"
                  style={{ background: SERIES[i] }}
                />
                {l.name}
              </span>
            ))}
          </div>
        </Card>

        <Card
          title="Power factor — 30 days"
          subtitle="Daily average while running · 0.90 is the tariff penalty threshold"
        >
          <div className="h-[230px]">
            <ResponsiveContainer>
              <LineChart data={days} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} tickFormatter={tick} />
                <YAxis
                  {...AXIS}
                  width={44}
                  domain={[0.8, 0.95]}
                  tickFormatter={(v: number) => v.toFixed(2)}
                />
                <Tooltip
                  content={<VTooltip formatter={(v) => v.toFixed(3)} />}
                  cursor={{ stroke: "var(--baseline)" }}
                />
                <ReferenceLine
                  y={0.9}
                  stroke="var(--status-warn)"
                  strokeDasharray="5 4"
                  label={{
                    value: "penalty threshold",
                    fill: "var(--status-warn)",
                    fontSize: 10,
                    position: "insideBottomRight",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPf"
                  name="Avg PF"
                  stroke="var(--series-2)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card
        title="Specific energy — 30 days"
        subtitle="kWh per km of finished cable; the number that decides margin"
      >
        <div className="h-[200px]">
          <ResponsiveContainer>
            <LineChart data={days} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} tickFormatter={tick} />
              <YAxis {...AXIS} width={56} domain={["auto", "auto"]} />
              <Tooltip
                content={<VTooltip formatter={(v) => `${fmt(v, 1)} kWh/km`} />}
                cursor={{ stroke: "var(--baseline)" }}
              />
              <Line
                type="monotone"
                dataKey="secKwhPerKm"
                name="SEC"
                stroke="var(--series-3)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {[240, 380, 260].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-ring-1 bg-surface"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
