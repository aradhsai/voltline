"use client";

import { useEffect, useState } from "react";

/** Wall-clock time, refreshed every `intervalMs`; null before mount (SSR-safe). */
export function useNow(intervalMs = 2000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
