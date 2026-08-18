// Voltline — deterministic plant data engine.
// Everything derives from a seeded PRNG keyed on (line, hour), so the estate
// is fully populated for any date without a database, and every client
// computes identical history. "Live" readings are smooth functions of wall
// time layered over the current hour's operating point.

export type DivisionId = "cable" | "crt" | "bsw" | "swg" | "picc";

export interface Line {
  id: string;
  name: string;
  machine: string;
  division: DivisionId;
  loop: string; // RS-485 loop / gateway, e.g. "GW-1"
  meter: string; // meter make/model on this machine
  ratedKw: number; // nameplate demand at full load
  idleKw: number; // heaters / drives idling
  maxSpeed: number; // m/min line speed
  product: string;
  continuous: boolean; // runs through the night shift
  imbalance: [number, number, number]; // per-phase current skew
}

export const LINES: Line[] = [
  { id: "rbd1", name: "RBD-1", machine: "Rod breakdown & wire draw", division: "cable", loop: "GW-1", meter: "Siemens PAC3200", ratedKw: 110, idleKw: 8, maxSpeed: 18, product: "8 mm Cu rod → 2.6 mm wire", continuous: false, imbalance: [1.03, 0.99, 0.98] },
  { id: "rbd2", name: "RBD-2", machine: "Rod breakdown & wire draw", division: "cable", loop: "GW-1", meter: "Siemens PAC3200", ratedKw: 110, idleKw: 8, maxSpeed: 18, product: "8 mm Cu rod → 2.6 mm wire", continuous: false, imbalance: [0.99, 1.02, 0.99] },
  { id: "mwd", name: "MWD", machine: "Multi-wire draw", division: "cable", loop: "GW-1", meter: "Trinity NF-29", ratedKw: 85, idleKw: 6, maxSpeed: 32, product: "2.6 mm → 0.9 mm × 8 ends", continuous: false, imbalance: [0.98, 1.02, 1.0] },
  { id: "stra37", name: "37 Str.", machine: "37-bobbin strander", division: "cable", loop: "GW-1", meter: "Selec MFM384", ratedKw: 70, idleKw: 5, maxSpeed: 40, product: "185 mm² Cu conductor", continuous: false, imbalance: [1.01, 0.98, 1.01] },
  { id: "skip16", name: "1+6 Skip", machine: "1+6 skip strander", division: "cable", loop: "GW-1", meter: "Selec MFM384", ratedKw: 40, idleKw: 3, maxSpeed: 30, product: "25 mm² stranded conductor", continuous: false, imbalance: [1.0, 1.01, 0.99] },
  { id: "assem1600", name: "1600mm Assem.", machine: "1600 mm assembly / lay-up", division: "cable", loop: "GW-2", meter: "Acrel ACR", ratedKw: 55, idleKw: 4, maxSpeed: 20, product: "multi-core lay-up", continuous: false, imbalance: [0.99, 1.0, 1.01] },
  { id: "e12045", name: "120/45", machine: "Insulation extruder", division: "cable", loop: "GW-2", meter: "Siemens PAC3200", ratedKw: 60, idleKw: 9, maxSpeed: 14, product: "PVC insulated cores", continuous: false, imbalance: [1.02, 0.99, 0.99] },
  { id: "e9045", name: "90/45", machine: "Insulation extruder", division: "cable", loop: "GW-2", meter: "Siemens PAC3200", ratedKw: 50, idleKw: 8, maxSpeed: 16, product: "PVC insulated cores", continuous: false, imbalance: [0.98, 1.01, 1.01] },
  { id: "dt2600", name: "2600DT", machine: "2600 mm drum twister", division: "cable", loop: "GW-2", meter: "Selec MFM384", ratedKw: 95, idleKw: 7, maxSpeed: 26, product: "3-core laid-up LV cable", continuous: false, imbalance: [0.97, 1.0, 1.03] },
  { id: "e1206012", name: "120/60/120", machine: "Insulation & sheathing extrusion", division: "cable", loop: "GW-2", meter: "Siemens PAC3200", ratedKw: 75, idleKw: 12, maxSpeed: 11, product: "PVC / XLPE insulated cores", continuous: true, imbalance: [1.01, 1.0, 0.99] },
  { id: "arm72b", name: "72B Armouring", machine: "72-bobbin armouring", division: "cable", loop: "GW-3", meter: "Selec MFM384", ratedKw: 45, idleKw: 4, maxSpeed: 22, product: "SWA over bedding", continuous: false, imbalance: [1.0, 0.99, 1.01] },
  { id: "arm48b", name: "48B Armouring", machine: "48-bobbin armouring", division: "cable", loop: "GW-3", meter: "Selec MFM384", ratedKw: 40, idleKw: 4, maxSpeed: 24, product: "SWA over bedding", continuous: false, imbalance: [1.01, 1.0, 0.99] },
  { id: "boiler1", name: "Boiler-1", machine: "Process boiler", division: "cable", loop: "GW-3", meter: "AGAM AGM13H", ratedKw: 55, idleKw: 2, maxSpeed: 0, product: "process steam", continuous: false, imbalance: [1.0, 1.0, 1.0] },
  { id: "boiler2", name: "Boiler-2", machine: "Process boiler", division: "cable", loop: "GW-3", meter: "Selec MFM384", ratedKw: 55, idleKw: 2, maxSpeed: 0, product: "process steam", continuous: false, imbalance: [1.0, 1.01, 0.99] },
  { id: "comp90", name: "Compressor 90+", machine: "Air compressor", division: "cable", loop: "GW-4", meter: "Selec MFM384", ratedKw: 90, idleKw: 9, maxSpeed: 0, product: "compressed air 7.5 bar", continuous: true, imbalance: [1.0, 0.99, 1.01] },
  { id: "compg111", name: "Compressor G111", machine: "Air compressor", division: "cable", loop: "GW-4", meter: "Selec MFM384", ratedKw: 75, idleKw: 8, maxSpeed: 0, product: "compressed air 7.5 bar", continuous: true, imbalance: [0.99, 1.01, 1.0] },
  { id: "comp45", name: "Compressor 45", machine: "Air compressor", division: "cable", loop: "GW-4", meter: "AGAM AGM13H", ratedKw: 45, idleKw: 5, maxSpeed: 0, product: "compressed air 7.5 bar", continuous: true, imbalance: [1.01, 1.0, 0.99] },
  { id: "pump", name: "Pump House", machine: "Cooling water pumps", division: "cable", loop: "GW-4", meter: "Selec MFM384 (new)", ratedKw: 20, idleKw: 2, maxSpeed: 0, product: "process cooling water", continuous: true, imbalance: [1.0, 1.0, 1.0] },
  { id: "chiller1", name: "Chiller-1", machine: "Water-cooled chiller", division: "cable", loop: "GW-5", meter: "AGAM AGM13H", ratedKw: 140, idleKw: 12, maxSpeed: 0, product: "chilled water", continuous: true, imbalance: [1.0, 0.99, 1.01] },
  { id: "chiller2", name: "Chiller-2", machine: "Water-cooled chiller", division: "cable", loop: "GW-5", meter: "AGAM AGM13H", ratedKw: 140, idleKw: 12, maxSpeed: 0, product: "chilled water", continuous: true, imbalance: [0.99, 1.0, 1.01] },
  { id: "chiller3", name: "Chiller-3", machine: "Water-cooled chiller", division: "cable", loop: "GW-5", meter: "AGAM AGM13H", ratedKw: 140, idleKw: 12, maxSpeed: 0, product: "chilled water", continuous: true, imbalance: [1.01, 1.0, 0.99] },
  { id: "oven1", name: "Heating Oven-1", machine: "Annealing oven", division: "crt", loop: "GW-6", meter: "AGAM AGM13H", ratedKw: 65, idleKw: 3, maxSpeed: 0, product: "conductor annealing", continuous: false, imbalance: [1.0, 1.0, 1.0] },
  { id: "oven2", name: "Heating Oven-2", machine: "Annealing oven", division: "crt", loop: "GW-6", meter: "AGAM AGM13H", ratedKw: 65, idleKw: 3, maxSpeed: 0, product: "conductor annealing", continuous: false, imbalance: [1.0, 1.01, 0.99] },
  { id: "oven3", name: "Heating Oven-3", machine: "Annealing oven", division: "crt", loop: "GW-6", meter: "AGAM AGM13H", ratedKw: 65, idleKw: 3, maxSpeed: 0, product: "conductor annealing", continuous: false, imbalance: [0.99, 1.0, 1.01] },
  { id: "casting", name: "Casting Machine", machine: "Cu rod casting", division: "crt", loop: "GW-6", meter: "Selec MFM384 (new)", ratedKw: 75, idleKw: 6, maxSpeed: 12, product: "8 mm Cu rod", continuous: false, imbalance: [1.02, 0.99, 0.99] },
  { id: "powder", name: "Powder Coating", machine: "Powder coating line", division: "bsw", loop: "GW-7", meter: "Selec MFM376", ratedKw: 35, idleKw: 3, maxSpeed: 0, product: "coated steel wire", continuous: false, imbalance: [1.0, 1.0, 1.0] },
  { id: "shotblast", name: "Shot Blast", machine: "Shot blasting", division: "swg", loop: "GW-7", meter: "AGAM AGM13H", ratedKw: 30, idleKw: 2, maxSpeed: 0, product: "surface prep", continuous: false, imbalance: [1.0, 1.01, 0.99] },
  { id: "amada2510", name: "Amada 2510", machine: "CNC punching", division: "swg", loop: "GW-7", meter: "Selec MFM384 (new)", ratedKw: 25, idleKw: 2, maxSpeed: 0, product: "sheet fabrication", continuous: false, imbalance: [1.0, 1.0, 1.0] },
  { id: "amada3612", name: "Amada 3612", machine: "CNC punching", division: "swg", loop: "GW-7", meter: "Selec MFM384 (new)", ratedKw: 25, idleKw: 2, maxSpeed: 0, product: "sheet fabrication", continuous: false, imbalance: [0.99, 1.0, 1.01] },
  { id: "rbdp", name: "RBD", machine: "PICC wire draw", division: "picc", loop: "GW-7", meter: "AGAM AGM13H", ratedKw: 50, idleKw: 4, maxSpeed: 16, product: "Cu wire draw", continuous: false, imbalance: [1.0, 0.99, 1.01] },
];

export const DIVISIONS: { id: DivisionId; name: string }[] = [
  { id: "cable", name: "Cable" },
  { id: "crt", name: "CRT" },
  { id: "bsw", name: "BSW" },
  { id: "swg", name: "SWG" },
  { id: "picc", name: "PICC" },
];

export function linesInDivision(id: DivisionId): Line[] {
  return LINES.filter((l) => l.division === id);
}

export const TARIFF_AED_PER_KWH = 0.45;
export const CARBON_KG_PER_KWH = 0.43;
export const NOMINAL_LL_VOLTAGE = 400;

// ---------------------------------------------------------------- PRNG

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rng(...keys: (string | number)[]): () => number {
  return mulberry32(hashString(keys.join("|")));
}

// ---------------------------------------------------------------- hourly history

export interface HourRecord {
  line: string;
  date: string; // YYYY-MM-DD local
  hour: number; // 0-23
  running: boolean;
  uptime: number; // 0..1 fraction of the hour producing
  energyKwh: number;
  productionM: number;
  avgSpeed: number; // m/min while running
  pf: number;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Deterministic operating record for one line-hour. */
export function hourRecord(line: Line, d: Date, hour: number): HourRecord {
  const date = dateKey(d);
  const r = rng(line.id, date, hour);
  const dow = d.getDay(); // 0 = Sunday

  // Shift pattern: two production shifts 06-14 / 14-22; continuous lines run
  // the night shift too. Sunday is planned maintenance (short morning run).
  let scheduled: boolean;
  if (dow === 0) scheduled = line.continuous;
  else if (line.continuous) scheduled = true;
  else scheduled = hour >= 6 && hour < 22;

  // Occasional unplanned stop: ~6% of scheduled hours lose most of the hour.
  const stopped = scheduled && r() < 0.06;
  const uptime = !scheduled ? 0 : stopped ? 0.15 + r() * 0.2 : 0.86 + r() * 0.14;
  const running = uptime > 0.3;

  // Load factor drifts by shift; night runs lighter.
  const shiftBias = hour >= 22 || hour < 6 ? 0.62 : hour < 14 ? 0.78 : 0.72;
  const load = Math.min(0.95, shiftBias + (r() - 0.5) * 0.18);

  const energyKwh =
    line.ratedKw * load * uptime + line.idleKw * (1 - uptime) * (scheduled ? 1 : 0.4);

  const speedFactor = 0.8 + r() * 0.17;
  const avgSpeed = running && line.maxSpeed > 0 ? line.maxSpeed * speedFactor : 0;
  const productionM = avgSpeed * 60 * uptime;

  const pf = running ? 0.84 + r() * 0.08 : scheduled ? 0.58 + r() * 0.1 : 0.5;

  return {
    line: line.id,
    date,
    hour,
    running,
    uptime,
    energyKwh: round2(energyKwh),
    productionM: Math.round(productionM),
    avgSpeed: round2(avgSpeed),
    pf: round3(pf),
  };
}

export interface DaySummary {
  date: string;
  label: string; // e.g. "Mon 11"
  energyKwh: number;
  productionM: number;
  secKwhPerKm: number; // specific energy consumption
  avgPf: number;
  carbonKg: number;
  costAed: number;
  perLine: Record<string, { energyKwh: number; productionM: number }>;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Aggregate a full (or partial, up to `untilHour`) day across all lines. */
export function daySummary(d: Date, untilHour = 24): DaySummary {
  let energy = 0;
  let production = 0;
  let pfSum = 0;
  let pfN = 0;
  const perLine: DaySummary["perLine"] = {};
  for (const line of LINES) {
    let le = 0;
    let lp = 0;
    for (let h = 0; h < untilHour; h++) {
      const rec = hourRecord(line, d, h);
      le += rec.energyKwh;
      lp += rec.productionM;
      if (rec.running) {
        pfSum += rec.pf;
        pfN++;
      }
    }
    perLine[line.id] = { energyKwh: round2(le), productionM: Math.round(lp) };
    energy += le;
    production += lp;
  }
  return {
    date: dateKey(d),
    label: `${DOW[d.getDay()]} ${d.getDate()}`,
    energyKwh: round2(energy),
    productionM: Math.round(production),
    secKwhPerKm: production > 0 ? round2(energy / (production / 1000)) : 0,
    avgPf: pfN > 0 ? round3(pfSum / pfN) : 0,
    carbonKg: round2(energy * CARBON_KG_PER_KWH),
    costAed: round2(energy * TARIFF_AED_PER_KWH),
    perLine,
  };
}

/** Last `n` complete days ending yesterday (oldest first). */
export function lastNDays(n: number, now: Date): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(daySummary(d));
  }
  return out;
}

// ---------------------------------------------------------------- live readings

export interface LiveReading {
  line: string;
  running: boolean;
  kw: number;
  kva: number;
  pf: number;
  currents: [number, number, number]; // L1 L2 L3 amps
  phaseV: [number, number, number]; // L-N volts
  lineV: [number, number, number]; // L-L volts U12 U23 U31
  imbalancePct: number;
  freqHz: number;
  speed: number; // m/min
  speedSetpoint: number;
  diameterMm: number;
  diameterSetMm: number;
  lengthTodayM: number; // cable length counter since midnight
  energyTodayKwh: number;
  totalizerKwh: number; // lifetime accumulated energy register
}

function smooth(t: number, period: number, phase: number): number {
  // bounded ±1 pseudo-noise, C¹-smooth in t
  return (
    0.6 * Math.sin((t / period) * 2 * Math.PI + phase) +
    0.3 * Math.sin((t / (period * 0.37)) * 2 * Math.PI + phase * 2.7) +
    0.1 * Math.sin((t / (period * 0.11)) * 2 * Math.PI + phase * 5.1)
  );
}

const DIAMETER_SET: Record<string, number> = {
  rbd1: 2.6, rbd2: 2.6, mwd: 0.9, stra37: 16.8, skip16: 8.4,
  assem1600: 34.0, e12045: 12.5, e9045: 9.8, dt2600: 42.0, e1206012: 28.5,
  arm72b: 46.5, arm48b: 38.2, casting: 8.0, rbdp: 2.2,
};

/** Smooth live operating point for a line at wall-clock time `tMs`. */
export function liveReading(line: Line, tMs: number): LiveReading {
  const d = new Date(tMs);
  const rec = hourRecord(line, d, d.getHours());
  const phase = hashString(line.id) % 628 / 100;
  const t = tMs / 1000;

  const running = rec.running;
  const baseKw = running
    ? rec.energyKwh / Math.max(rec.uptime, 0.05)
    : line.idleKw;
  const kw = Math.max(
    running ? line.idleKw : 0.4,
    baseKw * (1 + 0.05 * smooth(t, 47, phase))
  );
  const pf = Math.min(
    0.97,
    Math.max(0.5, rec.pf + 0.012 * smooth(t, 61, phase + 1))
  );
  const kva = kw / pf;

  const vDrift = (i: number) =>
    NOMINAL_LL_VOLTAGE * (1 + 0.004 * smooth(t, 89, phase + i * 2.1));
  const lineV: [number, number, number] = [
    round2(vDrift(0)),
    round2(vDrift(1)),
    round2(vDrift(2)),
  ];
  const phaseV: [number, number, number] = [
    round2(lineV[0] / Math.sqrt(3)),
    round2(lineV[1] / Math.sqrt(3)),
    round2(lineV[2] / Math.sqrt(3)),
  ];

  const iAvg = (kw * 1000) / (Math.sqrt(3) * NOMINAL_LL_VOLTAGE * pf);
  const currents: [number, number, number] = [0, 1, 2].map((i) =>
    round2(
      iAvg *
        line.imbalance[i] *
        (1 + 0.02 * smooth(t, 31 + i * 7, phase + i))
    )
  ) as [number, number, number];
  const iMax = Math.max(...currents);
  const iMean = (currents[0] + currents[1] + currents[2]) / 3;
  const imbalancePct = iMean > 0 ? round2(((iMax - iMean) / iMean) * 100) : 0;

  const speedSetpoint = round2(line.maxSpeed * 0.85);
  const speed = running
    ? round2(speedSetpoint * (1 + 0.015 * smooth(t, 23, phase + 3)))
    : 0;

  const diameterSetMm = DIAMETER_SET[line.id] ?? 0;
  const diameterMm = running
    ? round3(diameterSetMm * (1 + 0.0018 * smooth(t, 17, phase + 4)))
    : diameterSetMm;

  // Counters since midnight: completed hours + fraction of the current hour.
  let lengthTodayM = 0;
  let energyTodayKwh = 0;
  for (let h = 0; h < d.getHours(); h++) {
    const r = hourRecord(line, d, h);
    lengthTodayM += r.productionM;
    energyTodayKwh += r.energyKwh;
  }
  const frac = (d.getMinutes() * 60 + d.getSeconds()) / 3600;
  lengthTodayM += rec.productionM * frac;
  energyTodayKwh += rec.energyKwh * frac;

  // Lifetime register: seeded base + days since epoch-ish anchor.
  const daysSinceAnchor = Math.floor(tMs / 86400000) - 20000;
  const totalizerKwh =
    Math.floor(rng(line.id, "totalizer")() * 900000) +
    daysSinceAnchor * line.ratedKw * 11 +
    energyTodayKwh;

  return {
    line: line.id,
    running,
    kw: round2(kw),
    kva: round2(kva),
    pf: round3(pf),
    currents,
    phaseV,
    lineV,
    imbalancePct,
    freqHz: round2(50 + 0.02 * smooth(t, 41, phase + 5)),
    speed,
    speedSetpoint,
    diameterMm,
    diameterSetMm,
    lengthTodayM: Math.round(lengthTodayM),
    energyTodayKwh: round2(energyTodayKwh),
    totalizerKwh: Math.round(totalizerKwh),
  };
}

// ---------------------------------------------------------------- alerts

export interface PlantAlert {
  id: string;
  severity: "warning" | "serious";
  line: string;
  title: string;
  detail: string;
  at: string; // HH:mm today
}

/** Deterministic alert feed derived from today's records. */
export function todaysAlerts(now: Date): PlantAlert[] {
  const alerts: PlantAlert[] = [];
  const untilHour = now.getHours();
  for (const line of LINES) {
    for (let h = 0; h <= untilHour; h++) {
      const rec = hourRecord(line, now, h);
      const at = `${String(h).padStart(2, "0")}:${String(
        10 + (hashString(line.id + h) % 45)
      ).padStart(2, "0")}`;
      if (rec.running && rec.pf < 0.855) {
        alerts.push({
          id: `${line.id}-pf-${h}`,
          severity: "warning",
          line: line.name,
          title: "Low power factor",
          detail: `PF ${rec.pf.toFixed(2)} while running — check capacitor bank stage`,
          at,
        });
      }
      if (!rec.running && rec.uptime === 0 && rec.energyKwh > line.idleKw * 0.5 && h >= 6 && h < 22) {
        alerts.push({
          id: `${line.id}-idle-${h}`,
          severity: "serious",
          line: line.name,
          title: "Idle-hour energy draw",
          detail: `${rec.energyKwh.toFixed(0)} kWh drawn with zero production this hour`,
          at,
        });
      }
      if (rec.running && rec.uptime < 0.4) {
        alerts.push({
          id: `${line.id}-stop-${h}`,
          severity: "warning",
          line: line.name,
          title: "Unplanned stop",
          detail: `Line down ${Math.round((1 - rec.uptime) * 60)} min of the hour`,
          at,
        });
      }
    }
  }
  return alerts.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8);
}

// ---------------------------------------------------------------- helpers

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

export function lineById(id: string): Line {
  return LINES.find((l) => l.id === id)!;
}
