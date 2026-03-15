"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { UsageData } from "@/lib/types";
import { getEncrypted } from "@/lib/storage";
import { StatusBadge } from "./status-badge";
import { SummaryCards } from "./summary-cards";
import { RateDisplay } from "./rate-display";
import { RateChart } from "./rate-chart";
import { InterfaceTable } from "./interface-table";
import { PacketSummaryDisplay } from "./packet-summary";
import { SessionInfo } from "./session-info";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const HISTORY_LIMIT = 30;
const POLL_INTERVAL_KEY = "pollIntervalMs";
const DEFAULT_POLL_INTERVAL_MS = 30000;
const ROUTER_CONFIG_KEY = "routerConfig";

const POLL_OPTIONS = [
  { label: "10 sec", value: 10000 },
  { label: "15 sec", value: 15000 },
  { label: "30 sec", value: 30000 },
  { label: "1 min", value: 60000 },
  { label: "5 min", value: 300000 },
];

type ErrorKind =
  | "unreachable"
  | "auth"
  | "config"
  | "generic";

function classifyError(message: string): ErrorKind {
  const m = message.toLowerCase();

  if (
    m.includes("fetch failed") ||
    m.includes("econnrefused") ||
    m.includes("econnreset") ||
    m.includes("etimedout") ||
    m.includes("network") ||
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("connection refused") ||
    m.includes("connection reset") ||
    m.includes("timed out") ||
    m.includes("request failed with status 5")
  ) {
    return "unreachable";
  }

  if (
    m.includes("login failed") ||
    m.includes("session was not accepted") ||
    m.includes("request failed with status 403") ||
    m.includes("auth_expired") ||
    m.includes("session expired")
  ) {
    return "auth";
  }

  if (
    m.includes("could not find the latest login sid") ||
    m.includes("could not resolve the wan traffic page") ||
    m.includes("could not parse wan usage rows") ||
    m.includes("request failed with status 4")
  ) {
    return "config";
  }

  return "generic";
}

interface ErrorInfo {
  title: string;
  description: string;
  hint: string;
  showSetup: boolean;
}

function getErrorInfo(message: string | null): ErrorInfo {
  const kind = classifyError(message ?? "");

  switch (kind) {
    case "unreachable":
      return {
        title: "Router Unreachable",
        description:
          "The app cannot connect to your router. It may be powered off, restarting, or on a different network.",
        hint: "Make sure your device is on the same network as the router and the router is powered on. If the IP address has changed, update it in Setup.",
        showSetup: true,
      };
    case "auth":
      return {
        title: "Login Failed",
        description:
          "The router rejected the credentials. The username or password saved in your config appears to be incorrect.",
        hint: "Double-check your router admin username and password in Setup. The default is usually admin / admin.",
        showSetup: true,
      };
    case "config":
      return {
        title: "Configuration Mismatch",
        description:
          "The app connected to the router but could not read usage data. The router model or base URL may be set incorrectly.",
        hint: "Verify the router base URL and model in Setup. Make sure the URL points to the router admin page (e.g. http://192.168.1.1).",
        showSetup: true,
      };
    default:
      return {
        title: "Something Went Wrong",
        description: message ?? "An unexpected error occurred while fetching router data.",
        hint: "Try retrying. If the problem persists, check your router config in Setup.",
        showSetup: true,
      };
  }
}

function calculateRates(
  previous: UsageData | null,
  current: UsageData
): { txRate: number; rxRate: number } {
  if (!previous) {
    return { txRate: 0, rxRate: 0 };
  }

  const elapsedSeconds = Math.max(
    1,
    (new Date(current.capturedAt).getTime() -
      new Date(previous.capturedAt).getTime()) /
      1000
  );

  const txDelta = Math.max(
    0,
    current.wan.totals.txBytes - previous.wan.totals.txBytes
  );
  const rxDelta = Math.max(
    0,
    current.wan.totals.rxBytes - previous.wan.totals.rxBytes
  );

  return {
    txRate: txDelta / elapsedSeconds,
    rxRate: rxDelta / elapsedSeconds,
  };
}

export function Dashboard() {
  const router = useRouter();

  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading" | "connected" | "error" | "offline"
  >("loading");
  const [offlineBannerDismissed, setOfflineBannerDismissed] = useState(false);
  const [history, setHistory] = useState<
    Array<{ txRate: number; rxRate: number }>
  >([]);
  const [rates, setRates] = useState({ txRate: 0, rxRate: 0 });
  const previousSampleRef = useRef<UsageData | null>(null);
  const dataRef = useRef<UsageData | null>(null);

  const [pollIntervalMs, setPollIntervalMs] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_POLL_INTERVAL_MS;
    const stored = localStorage.getItem(POLL_INTERVAL_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return POLL_OPTIONS.some((o) => o.value === parsed) ? parsed : DEFAULT_POLL_INTERVAL_MS;
  });

  const fetchUsage = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const localRaw = await getEncrypted(ROUTER_CONFIG_KEY);
      if (localRaw) {
        headers["X-Router-Config"] = localRaw;
      }

      const res = await fetch("/api/usage", { headers });
      let body: { error?: string; code?: string } | null = null;
      if (!res.ok) {
        body = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        if (body?.code === "NO_CONFIG") {
          router.push("/setup");
          return;
        }
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      const usage: UsageData = await res.json();
      setData(usage);
      dataRef.current = usage;
      setError(null);
      setStatus("connected");
      setOfflineBannerDismissed(false);

      const { txRate, rxRate } = calculateRates(
        previousSampleRef.current,
        usage
      );
      setRates({ txRate, rxRate });
      previousSampleRef.current = usage;

      setHistory((prev) => {
        const next = [...prev, { txRate, rxRate }];
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

  function handleIntervalChange(value: number) {
    setPollIntervalMs(value);
    localStorage.setItem(POLL_INTERVAL_KEY, String(value));
  }

  const peakRate = useMemo(
    () => Math.max(...history.flatMap((p) => [p.txRate, p.rxRate]), 1),
    [history]
  );

  const chartData = history.map((point, index) => ({
    index,
    txRate: point.txRate,
    rxRate: point.rxRate,
    total: point.txRate + point.rxRate,
  }));

  if (status === "loading" && !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              Data Usage Tracker
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status="loading" />
              <ThemeToggle />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (status === "error" && !data) {
    const errInfo = getErrorInfo(error);
    const errorKind = classifyError(error ?? "");

    const iconMap: Record<ErrorKind, string> = {
      unreachable: "📡",
      auth: "🔐",
      config: "⚙️",
      generic: "⚠️",
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Data Usage Tracker
        </h1>
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="mb-4 flex items-start gap-3">
            <span className="mt-0.5 text-2xl" aria-hidden>
              {iconMap[errorKind]}
            </span>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">
                {errInfo.title}
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {errInfo.description}
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-red-200/60 bg-red-100/50 px-4 py-3 dark:border-red-800/40 dark:bg-red-900/20">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              What to check
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {errInfo.hint}
            </p>
          </div>

          {error && (
            <details className="mb-5 group">
              <summary className="cursor-pointer select-none text-xs text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-300">
                Technical details
              </summary>
              <p className="mt-2 rounded-md bg-red-100 px-3 py-2 font-mono text-xs text-red-700 break-all dark:bg-red-900/30 dark:text-red-300">
                {error}
              </p>
            </details>
          )}

          <div className="flex justify-end gap-3">
            {errInfo.showSetup && (
              <button
                onClick={() => router.push("/setup")}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Open Setup
              </button>
            )}
            <button
              onClick={() => {
                setStatus("loading");
                fetchUsage();
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const offlineBannerErrorKind = classifyError(error ?? "");
  const offlineBannerMessages: Record<ErrorKind, string> = {
    unreachable: "Router is unreachable — it may be powered off or restarting.",
    auth: "Router credentials are incorrect — live data paused.",
    config: "Router config mismatch — live data paused.",
    generic: "Router connection lost — live data paused.",
  };

  const offlineBanner =
    status === "offline" && !offlineBannerDismissed ? (
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-amber-800 dark:text-amber-300">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <div>
                <p className="font-medium">
                  {offlineBannerMessages[offlineBannerErrorKind]}
                </p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  Showing last known data from{" "}
                  <span className="font-medium">
                    {data
                      ? new Date(data.capturedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : "last session"}
                  </span>
                  . Live updates will resume automatically when the router is
                  back online.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setStatus("loading");
                  fetchUsage();
                }}
                className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
              >
                Retry
              </button>
              <button
                onClick={() => setOfflineBannerDismissed(true)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  if (!data) return null;

  const lastUpdated = new Date(data.capturedAt).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {offlineBanner}
      <header className="sticky top-0 z-10 border-b border-zinc-200/50 bg-zinc-50/80 px-4 py-4 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              Airtel {data.routerModel} WAN Dashboard
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                Last updated {lastUpdated}
              </p>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Refresh every</span>
                <select
                  value={pollIntervalMs}
                  onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {POLL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <ThemeToggle />
            <UserMenu onSetup={() => router.push("/setup")} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <SummaryCards totals={data.wan.totals} />

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <RateDisplay
            txRate={rates.txRate}
            rxRate={rates.rxRate}
            peakRate={peakRate}
          />
          <PacketSummaryDisplay packetSummary={data.wan.packetSummary} />
        </div>

        <SessionInfo interfaces={data.wan.interfaces} capturedAt={data.capturedAt} />

        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Rate History
          </h2>
          <RateChart history={chartData} />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Interfaces
          </h2>
          <InterfaceTable interfaces={data.wan.interfaces} />
        </div>
      </div>
    </div>
  );
}
