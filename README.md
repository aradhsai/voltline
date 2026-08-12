# Voltline — energy meter automation

Energy monitoring and reporting for a cable manufacturing plant. Four production
lines (wire draw, stranding, XLPE extrusion, armouring) each carry a Modbus TCP
energy meter and a line PLC; Voltline turns those registers into a live control
room view, daily energy analytics, and exportable reports.

**Live demo:** all data is simulated — a deterministic seeded generator keyed to
the wall clock produces 30 days of realistic history plus smooth "live" readings,
so the app is always fully populated with no database behind it.

## Views

- **Dashboard** — today's energy, production, specific energy (kWh/km), carbon
  and cost; live plant load (last 60 min); hourly energy stacked by line;
  7-day summaries and a rule-based event feed (low PF, idle draw, unplanned stops).
- **Process** — the live panel: per-phase currents and voltages, line voltages,
  active/apparent power, power factor, frequency, current imbalance, the
  accumulated energy register, and PLC production data (speed vs setpoint,
  diameter vs setpoint with µm error, length counters) with an animated
  three-phase waveform. Values tick every 2 s.
- **Reports** — range presets (7/14/30 days, month-to-date), per-line breakdown,
  daily table with totals, one-click CSV export.
- **Trends** — 30-day energy, a day×hour load heatmap (the two-shift pattern and
  Sunday maintenance window read directly), per-line energy, power factor vs the
  0.90 tariff penalty threshold, and specific energy.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Framer Motion.
All pages are static; everything computes client-side from the seeded generator
in `src/lib/data.ts`.

## Run

```bash
npm install
npm run dev
```

## Notes on the simulation

- Two production shifts (06–14, 14–22); the extrusion line runs continuously;
  Sunday is a maintenance window.
- Energy = load-factor model over each line's nameplate rating, with idle draw,
  unplanned stops, and per-phase current imbalance.
- Tariff 0.45 AED/kWh, grid carbon factor 0.43 kg CO₂e/kWh.
- The generator is pure: any client at the same wall-clock time computes the
  same estate, which is what makes a database unnecessary for a demo.
