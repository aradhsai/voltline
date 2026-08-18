"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  DIVISIONS,
  LINES,
  daySummary,
  hourRecord,
  lastNDays,
  liveReading,
  todaysAlerts,
  CARBON_KG_PER_KWH,
  TARIFF_AED_PER_KWH,
} from "@/lib/data";
import { fmt, fmtLength } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { AXIS, Card, DIV_COLOR, GRID, StatTile, VTooltip } from "@/components/ui";

export default function Dashboard() {
  const now = useNow(2000);
  if (!now) return <PageSkeleton />;

  const live = LINES.map((l) => liveReading(l, now.getTime()));
  const totalKw = live.reduce((s, r) => s + r.kw, 0);
  const energyToday = live.reduce((s, r) => s + r.energyTodayKwh, 0);
  const productionToday = live.reduce((s, r) => s + r.lengthTodayM, 0);
  const runningLines = live.filter((r) => r.running);
  const productiveRunning = live.filter(
    (r, i) => r.running && LINES[i].maxSpeed > 0
  );
  const avgSpeed =
    productiveRunning.length > 0
      ? productiveRunning.reduce((s, r) => s + r.speed, 0) /
        productiveRunning.length
      : 0;
  const sec =
    productionToday > 0 ? energyToday / (productionToday / 1000) : 0;

  // last 60 min plant load, one sample per minute
  const loadTrail = Array.from({ length: 61 }, (_, i) => {
    const t = now.getTime() - (60 - i) * 60000;
    const kw = LINES.reduce((s, l) => s + liveReading(l, t).kw, 0);
    const d = new Date(t);
    return {
      t: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      kw: Math.round(kw),
    };
  });

  // today's hourly energy per line (stacked), up to the current hour
  const hourly = Array.from({ length: now.getHours() + 1 }, (_, h) => {
    const row: Record<string, number | string> = {
      h: `${String(h).padStart(2, "0")}:00`,
    };
    for (const dv of DIVISIONS) {
      row[dv.name] = LINES.filter((l) => l.division === dv.id).reduce(
        (sum, l) => sum + daySummaryHourEnergy(l.id, now, h),
        0
      );
    }
    return row;
  });

  const week = lastNDays(7, now);
  const today = daySummary(now, now.getHours() + 1);
  const alerts = todaysAlerts(now);

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* headline strip */}
      <Card>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            label="Energy today"
            value={fmt(energyToday)}
            unit="kWh"
            accent="var(--copper)"
            sub={`AED ${fmt(energyToday * TARIFF_AED_PER_KWH)} at 0.45/kWh`}
          />
          <StatTile
            label="Production today"
            value={fmtLength(productionToday).split(" ")[0]}
            unit={fmtLength(productionToday).split(" ")[1]}
            sub={`${runningLines.length} of ${LINES.length} machines running`}
          />
          <StatTile
            label="Specific energy"
            value={sec > 0 ? fmt(sec, 1) : "—"}
            unit="kWh/km"
            sub="energy intensity of output"
          />
          <StatTile
            label="Carbon"
            value={fmt(energyToday * CARBON_KG_PER_KWH)}
            unit="kg CO₂e"
            sub="grid factor 0.43 kg/kWh"
          />
          <StatTile
            label="Avg line speed"
            value={fmt(avgSpeed, 1)}
            unit="m/min"
            sub="across running production lines"
          />
        </div>
      </Card>

      {/* live plant load */}
      <Card
        title="Plant load — live"
        subtitle="Total active power across all 30 metered machines, last 60 minutes"
        right={
          <div className="readout text-right">
            <span className="font-display text-[26px] font-bold text-copper">
              {fmt(totalKw)}
            </span>
            <span className="ml-1.5 text-[12px] text-ink-2">kW now</span>
          </div>
        }
      >
        <div className="h-[180px]">
          <ResponsiveContainer>
            <AreaChart data={loadTrail} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--copper)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--copper)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="t" {...AXIS} minTickGap={48} />
              <YAxis {...AXIS} width={52} />
              <Tooltip
                content={<VTooltip formatter={(v) => `${fmt(v)} kW`} />}
                cursor={{ stroke: "var(--baseline)" }}
              />
              <Area
                type="monotone"
                dataKey="kw"
                name="Plant load"
                stroke="var(--copper)"
                strokeWidth={2}
                fill="url(#loadFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {DIVISIONS.map((dv) => {
            const idx = LINES.map((l, i) => ({ l, i })).filter(
              ({ l }) => l.division === dv.id
            );
            const kw = idx.reduce((sum, { i }) => sum + live[i].kw, 0);
            const running = idx.filter(({ i }) => live[i].running).length;
            const rated = idx.reduce((sum, { l }) => sum + l.ratedKw, 0);
            const pct = Math.min(100, (kw / rated) * 100);
            return (
              <div
                key={dv.id}
                className="rounded-lg border border-ring-1 bg-surface-2 px-3 py-2.5"
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold">{dv.name}</span>
                  <span className="text-[10.5px] uppercase tracking-wider text-muted">
                    {running}/{idx.length} run
                  </span>
                </div>
                <div className="readout mt-1 text-[15px] font-semibold">
                  {fmt(kw)} <span className="text-[11px] text-muted">kW</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-baseline">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: DIV_COLOR[dv.id] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* today's hourly energy + week */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Energy by hour — today"
          subtitle="kWh per division, stacked; up to the current hour"
        >
          <div className="h-[240px]">
            <ResponsiveContainer>
              <BarChart data={hourly} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="h" {...AXIS} minTickGap={32} />
                <YAxis {...AXIS} width={52} />
                <Tooltip
                  content={<VTooltip formatter={(v) => `${fmt(v)} kWh`} />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                {DIVISIONS.map((dv, i) => (
                  <Bar
                    key={dv.id}
                    dataKey={dv.name}
                    stackId="e"
                    fill={DIV_COLOR[dv.id]}
                    stroke="var(--surface)"
                    strokeWidth={1}
                    radius={i === DIVISIONS.length - 1 ? [3, 3, 0, 0] : 0}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend />
        </Card>

        <Card
          title="Last 7 days"
          subtitle="Total energy per day, with specific energy trend"
        >
          <div className="h-[240px]">
            <ResponsiveContainer>
              <BarChart data={week} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis {...AXIS} width={52} />
                <Tooltip
                  content={<VTooltip formatter={(v) => `${fmt(v)} kWh`} />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar
                  dataKey="energyKwh"
                  name="Energy"
                  fill="var(--series-1)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11.5px] text-muted">
            Specific energy this week:{" "}
            <span className="readout text-ink-2">
              {fmt(
                week.reduce((s, d) => s + d.energyKwh, 0) /
                  (week.reduce((s, d) => s + d.productionM, 0) / 1000),
                1
              )}{" "}
              kWh/km avg
            </span>
          </div>
        </Card>
      </div>

      {/* SEC trend + alerts */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Specific energy — 7 days"
          subtitle="kWh per km of cable produced; lower is better"
        >
          <div className="h-[200px]">
            <ResponsiveContainer>
              <LineChart data={week} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis {...AXIS} width={52} domain={["auto", "auto"]} />
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
                  dot={{ r: 3.5, fill: "var(--series-3)", stroke: "var(--surface)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Events — today"
          subtitle={`${alerts.length} flagged from meter + PLC rules`}
        >
          <ul className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1 scroll-thin">
            {alerts.length === 0 && (
              <li className="text-[12.5px] text-muted">
                Nothing flagged yet today.
              </li>
            )}
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-2.5 rounded-lg border border-ring-1 bg-surface-2 px-3 py-2"
              >
                <span
                  className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background:
                      a.severity === "serious"
                        ? "var(--status-serious)"
                        : "var(--status-warn)",
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 text-[12.5px]">
                    <span className="font-semibold">{a.line}</span>
                    <span className="text-ink-2">{a.title}</span>
                    <span className="readout ml-auto shrink-0 text-[11px] text-muted">
                      {a.at}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted">
                    {a.detail}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* week table */}
      <Card
        title="Daily summary"
        subtitle="Last 7 complete days · today so far in the last row"
      >
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[640px] text-[12.5px]">
            <thead>
              <tr className="border-b border-ring-1 text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium text-right">Production</th>
                <th className="py-2 pr-4 font-medium text-right">Energy kWh</th>
                <th className="py-2 pr-4 font-medium text-right">kWh/km</th>
                <th className="py-2 pr-4 font-medium text-right">Avg PF</th>
                <th className="py-2 pr-4 font-medium text-right">CO₂e kg</th>
                <th className="py-2 font-medium text-right">Cost AED</th>
              </tr>
            </thead>
            <tbody className="readout">
              {[...week, { ...today, label: "Today" }].map((d, i, arr) => (
                <tr
                  key={d.date}
                  className={`border-b border-ring-1/60 ${
                    i === arr.length - 1 ? "text-copper" : ""
                  }`}
                >
                  <td className="py-2 pr-4 font-sans">{d.label}</td>
                  <td className="py-2 pr-4 text-right">{fmtLength(d.productionM)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(d.energyKwh)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(d.secKwhPerKm, 1)}</td>
                  <td className="py-2 pr-4 text-right">{d.avgPf.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(d.carbonKg)}</td>
                  <td className="py-2 text-right">{fmt(d.costAed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function daySummaryHourEnergy(lineId: string, now: Date, h: number): number {
  const line = LINES.find((l) => l.id === lineId)!;
  return hourRecord(line, now, h).energyKwh;
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {DIVISIONS.map((dv) => (
        <span key={dv.id} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
          <span
            className="inline-block h-2 w-2 rounded-[2px]"
            style={{ background: DIV_COLOR[dv.id] }}
          />
          {dv.name}
          <span className="text-muted">
            · {LINES.filter((l) => l.division === dv.id).length} machines
          </span>
        </span>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {[92, 300, 300].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-ring-1 bg-surface"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
