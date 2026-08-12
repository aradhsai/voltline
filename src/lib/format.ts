export function fmt(n: number, digits = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** 12,480 m → "12.48 km" above 10 km, else meters. */
export function fmtLength(m: number): string {
  return m >= 10000 ? `${fmt(m / 1000, 2)} km` : `${fmt(m)} m`;
}

export function fmtClock(d: Date): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtDateLong(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
