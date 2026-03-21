"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { UsageApiResponse, UsageData } from "@/lib/types";
import { getEncrypted } from "@/lib/storage";

const HISTORY_LIMIT = 30;
const POLL_INTERVAL_KEY = "pollIntervalMs";
const DEFAULT_POLL_INTERVAL_MS = 30000;
const ROUTER_CONFIG_KEY = "routerConfig";
const CRYPTO_KEY_STORAGE = "__dut_ck__";
const THEME_KEY = "theme";

export const POLL_OPTIONS = [
  { label: "10 sec", value: 10000 },
  { label: "15 sec", value: 15000 },
  { label: "30 sec", value: 30000 },
  { label: "1 min", value: 60000 },
  { label: "5 min", value: 300000 },
] as const;

export type DashboardStatus = "loading" | "connected" | "error" | "offline";

export interface RatePoint {
  txRate: number;
  rxRate: number;
}

export interface ChartPoint extends RatePoint {
  index: number;
  total: number;
}

function calculateRates(
  previous: UsageData | null,
  current: UsageData
): RatePoint {
  if (!previous) return { txRate: 0, rxRate: 0 };

  const elapsedSeconds = Math.max(
    1,
    (new Date(current.capturedAt).getTime() -
      new Date(previous.capturedAt).getTime()) /
      1000
  );

  return {
    txRate: Math.max(0, current.wan.totals.txBytes - previous.wan.totals.txBytes) / elapsedSeconds,
    rxRate: Math.max(0, current.wan.totals.rxBytes - previous.wan.totals.rxBytes) / elapsedSeconds,
  };
}

function loadStoredPollInterval(): number {
  if (typeof window === "undefined") return DEFAULT_POLL_INTERVAL_MS;
  const stored = localStorage.getItem(POLL_INTERVAL_KEY);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return POLL_OPTIONS.some((o) => o.value === parsed) ? parsed : DEFAULT_POLL_INTERVAL_MS;
}

export interface UseDashboardReturn {
  data: UsageApiResponse | null;
  error: string | null;
  status: DashboardStatus;
  rates: RatePoint;
  chartData: ChartPoint[];
  peakRate: number;
  pollIntervalMs: number;
  offlineBannerDismissed: boolean;
  hasStoredConfig: boolean;
  handleIntervalChange: (value: number) => void;
  handleRetry: () => void;
  dismissOfflineBanner: () => void;
  handleClearStorage: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const router = useRouter();

  const [data, setData] = useState<UsageApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [offlineBannerDismissed, setOfflineBannerDismissed] = useState(false);
  const [history, setHistory] = useState<RatePoint[]>([]);
  const [rates, setRates] = useState<RatePoint>({ txRate: 0, rxRate: 0 });
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(loadStoredPollInterval);
  const [hasStoredConfig, setHasStoredConfig] = useState<boolean>(false);

  const previousSampleRef = useRef<UsageData | null>(null);
  const dataRef = useRef<UsageApiResponse | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const localRaw = await getEncrypted(ROUTER_CONFIG_KEY);

      // Update hasStoredConfig based on whether decryption actually succeeded
      // (raw localStorage check is not reliable — the key may have been rotated)
      setHasStoredConfig(!!localRaw);

      if (localRaw) headers["X-Router-Config"] = localRaw;

      const res = await fetch("/api/usage", { headers });
      let body: { error?: string; code?: string } | null = null;
      if (!res.ok) body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (body?.code === "NO_CONFIG") {
          router.push("/setup");
          return;
        }
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      const response: UsageApiResponse = await res.json();
      const newRates = calculateRates(previousSampleRef.current, response.usage);

      setData(response);
      dataRef.current = response;
      setError(null);
      setStatus("connected");
      setOfflineBannerDismissed(false);
      setRates(newRates);
      previousSampleRef.current = response.usage;

      setHistory((prev) => {
        const next = [...prev, newRates];
        if (next.length > HISTORY_LIMIT) next.shift();
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStatus(dataRef.current ? "offline" : "error");
    }
  }, [router]);

  useEffect(() => {
    fetchUsage();
    const id = setInterval(fetchUsage, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchUsage, pollIntervalMs]);

  const handleIntervalChange = useCallback((value: number) => {
    setPollIntervalMs(value);
    localStorage.setItem(POLL_INTERVAL_KEY, String(value));
  }, []);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    fetchUsage();
  }, [fetchUsage]);

  const dismissOfflineBanner = useCallback(() => {
    setOfflineBannerDismissed(true);
  }, []);

  const handleClearStorage = useCallback(() => {
    localStorage.removeItem(ROUTER_CONFIG_KEY);
    localStorage.removeItem(POLL_INTERVAL_KEY);
    localStorage.removeItem(CRYPTO_KEY_STORAGE);
    localStorage.removeItem(THEME_KEY);
    setHasStoredConfig(false);
    router.push("/setup");
  }, [router]);

  const peakRate = useMemo(
    () => Math.max(...history.flatMap((p) => [p.txRate, p.rxRate]), 1),
    [history]
  );

  const chartData = useMemo<ChartPoint[]>(
    () => history.map((point, index) => ({ index, ...point, total: point.txRate + point.rxRate })),
    [history]
  );

  return {
    data,
    error,
    status,
    rates,
    chartData,
    peakRate,
    pollIntervalMs,
    offlineBannerDismissed,
    hasStoredConfig,
    handleIntervalChange,
    handleRetry,
    dismissOfflineBanner,
    handleClearStorage,
  };
}
