"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LINES, lineById, liveReading, type LiveReading } from "@/lib/data";
import { fmt, fmtLength } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { AXIS, Card, GRID, VTooltip } from "@/components/ui";

const PHASE_COLORS = ["var(--series-1)", "var(--series-4)", "var(--series-3)"];
const PHASE_NAMES = ["L1", "L2", "L3"];

export default function ProcessPage() {
  const now = useNow(2000);
  const [selected, setSelected] = useState("ext1");
  if (!now) return <Skeleton />;

  const readings = LINES.map((l) => liveReading(l, now.getTime()));
  const line = lineById(selected);
  const r = readings[LINES.findIndex((l) => l.id === selected)];

  // last 3 h of active power for the selected line, 5-min samples
  const powerTrail = Array.from({ length: 37 }, (_, i) => {
    const t = now.getTime() - (36 - i) * 5 * 60000;
    const d = new Date(t);
    return {
      t: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      kw: liveReading(line, t).kw,
    };
  });

  const diamErr = r.diameterMm - r.diameterSetMm;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      {/* line selector */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {LINES.map((l, i) => {
          const lr = readings[i];
          const active = l.id === selected;
          return (
            <button
              key={l.id}
              onClick={() => setSelected(l.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-copper bg-surface"
                  : "border-ring-1 bg-surface hover:border-ink-2/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[14px] font-semibold">
                  {l.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${
                    lr.running ? "text-good" : "text-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      lr.running ? "live-dot bg-good" : "bg-baseline"
                    }`}
                  />
                  {lr.running ? "Running" : "Idle"}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-muted">
                {l.machine}
              </div>
              <div className="readout mt-1.5 text-[15px] font-semibold">
                {fmt(lr.kw)} <span className="text-[11px] text-muted">kW</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* electrical panel */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card
          title={`${line.name} — energy meter`}
          subtitle={`Modbus TCP · unit 1 · ${line.product}`}
          right={<Waveform reading={r} />}
        >
          {/* phase columns */}
          <div className="grid grid-cols-3 gap-3">
            {PHASE_NAMES.map((ph, i) => (
              <div
                key={ph}
                className="rounded-lg border border-ring-1 bg-surface-2 p-3"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                  <span
                    className="inline-block h-2 w-2 rounded-[2px]"
                    style={{ background: PHASE_COLORS[i] }}
                  />
                  Phase {ph}
                </div>
                <div className="readout mt-2 text-[24px] font-semibold leading-none">
                  {r.currents[i].toFixed(1)}
                  <span className="ml-1 text-[12px] text-muted">A</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-baseline">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (r.currents[i] / (line.ratedKw * 1.9)) * 100)}%`,
                      background: PHASE_COLORS[i],
                    }}
                  />
                </div>
                <div className="readout mt-2.5 text-[12.5px] text-ink-2">
                  {r.phaseV[i].toFixed(1)}
                  <span className="text-muted"> V L-N</span>
                </div>
              </div>
            ))}
          </div>

          {/* line voltages + derived */}
          <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
            {(["U12", "U23", "U31"] as const).map((u, i) => (
              <div
                key={u}
                className="flex items-baseline justify-between rounded-lg border border-ring-1 px-3 py-2"
              >
                <span className="text-muted">{u}</span>
                <span className="readout text-[13.5px] text-ink">
                  {r.lineV[i].toFixed(1)} <span className="text-muted">V</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Meter label="Active" value={fmt(r.kw)} unit="kW" strong />
            <Meter label="Apparent" value={fmt(r.kva)} unit="kVA" />
            <Meter
              label="Power factor"
              value={r.pf.toFixed(3)}
              warn={r.pf < 0.85 && r.running}
            />
            <Meter label="Frequency" value={r.freqHz.toFixed(2)} unit="Hz" />
            <Meter
              label="I imbalance"
              value={`${r.imbalancePct.toFixed(1)}%`}
              warn={r.imbalancePct > 2.5}
            />
          </div>

          <div className="mt-3 flex items-baseline justify-between rounded-lg border border-ring-1 bg-surface-2 px-3.5 py-2.5">
            <span className="text-[11px] uppercase tracking-wider text-muted">
              Accumulated energy register
            </span>
            <span className="readout text-[16px] font-semibold text-copper">
              {fmt(r.totalizerKwh)}{" "}
              <span className="text-[11px] text-muted">kWh</span>
            </span>
          </div>
        </Card>

        {/* PLC / production panel */}
        <Card
          title={`${line.name} — PLC`}
          subtitle="Production data from the line controller"
        >
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Meter
                label="Line speed"
                value={r.speed.toFixed(1)}
                unit="m/min"
                strong
              />
              <Meter
                label="Speed setpoint"
                value={r.speedSetpoint.toFixed(1)}
                unit="m/min"
              />
              <Meter
                label="Diameter"
                value={r.diameterMm.toFixed(3)}
                unit="mm"
                strong
              />
              <Meter
                label="Set point"
                value={r.diameterSetMm.toFixed(3)}
                unit="mm"
              />
            </div>

            <div
              className={`flex items-baseline justify-between rounded-lg border px-3.5 py-2.5 ${
                Math.abs(diamErr) > r.diameterSetMm * 0.0015
                  ? "border-warn/40 bg-warn/5"
                  : "border-ring-1 bg-surface-2"
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider text-muted">
                Diameter error
              </span>
              <span className="readout text-[14px] font-semibold">
                {diamErr >= 0 ? "+" : ""}
                {(diamErr * 1000).toFixed(0)}{" "}
                <span className="text-[11px] text-muted">µm</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Meter
                label="Length today"
                value={fmtLength(r.lengthTodayM).split(" ")[0]}
                unit={fmtLength(r.lengthTodayM).split(" ")[1]}
              />
              <Meter
                label="Energy today"
                value={fmt(r.energyTodayKwh)}
                unit="kWh"
              />
            </div>

            <div className="h-[150px]">
              <ResponsiveContainer>
                <AreaChart
                  data={powerTrail}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="pFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="t" {...AXIS} minTickGap={40} />
                  <YAxis {...AXIS} width={44} />
                  <Tooltip
                    content={<VTooltip formatter={(v) => `${fmt(v)} kW`} />}
                    cursor={{ stroke: "var(--baseline)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kw"
                    name="Active power"
                    stroke="var(--series-1)"
                    strokeWidth={2}
                    fill="url(#pFill)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-1 text-[11px] text-muted">
              Active power, last 3 hours
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  unit,
  strong = false,
  warn = false,
}: {
  label: string;
  value: string;
  unit?: string;
  strong?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3.5 py-2.5 ${
        warn ? "border-warn/40 bg-warn/5" : "border-ring-1 bg-surface-2"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
        {label}
        {warn && (
          <span className="text-[10px] font-semibold text-warn">▲</span>
        )}
      </div>
      <div
        className={`readout mt-1 leading-none ${
          strong
            ? "text-[20px] font-semibold text-copper"
            : "text-[16px] font-medium text-ink"
        }`}
      >
        {value}
        {unit && <span className="ml-1 text-[11px] text-muted">{unit}</span>}
      </div>
    </div>
  );
}

/** Signature element: live three-phase waveform, amplitudes follow the
 * measured phase currents. Pure SVG, ~30 fps, pauses for reduced motion. */
function Waveform({ reading }: { reading: LiveReading }) {
  const [phase, setPhase] = useState(0);
  const raf = useRef<number>(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced.current) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 33) {
        setPhase((p) => p + 0.18);
        last = t;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const W = 150;
  const H = 44;
  const iMax = Math.max(...reading.currents, 1);
  const paths = reading.currents.map((amp, k) => {
    const scale = (H / 2 - 4) * (reading.running ? amp / iMax : 0.08);
    const pts: string[] = [];
    for (let x = 0; x <= W; x += 3) {
      const y =
        H / 2 -
        Math.sin((x / W) * Math.PI * 4 + phase + (k * 2 * Math.PI) / 3) * scale;
      pts.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Three-phase current waveform"
      className="shrink-0"
    >
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--grid)" />
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={PHASE_COLORS[i]}
          strokeWidth="1.6"
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[92px] animate-pulse rounded-xl border border-ring-1 bg-surface"
          />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-xl border border-ring-1 bg-surface" />
    </div>
  );
}
