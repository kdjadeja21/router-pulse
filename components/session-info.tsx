import type { InterfaceEntry } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface SessionInfoProps {
  interfaces: InterfaceEntry[];
  capturedAt: string;
}

/**
 * Parse the router's uptime string into total seconds.
 *
 * Handles multiple formats the router may emit:
 *   "2d 3h 14m 5s"   — suffix style (d/h/m/s)
 *   "3:14:05"         — HH:MM:SS
 *   "1:03:14:05"      — D:HH:MM:SS
 *   "0"               — zero / not connected
 */
function parseUptimeSeconds(uptime: string): number {
  if (!uptime || uptime === "0" || uptime === "-") return 0;

  // Suffix style: "2d 3h 14m 5s" (any subset)
  if (/[dhms]/i.test(uptime)) {
    const d = parseInt(uptime.match(/(\d+)\s*d/i)?.[1] ?? "0", 10);
    const h = parseInt(uptime.match(/(\d+)\s*h/i)?.[1] ?? "0", 10);
    const m = parseInt(uptime.match(/(\d+)\s*m/i)?.[1] ?? "0", 10);
    const s = parseInt(uptime.match(/(\d+)\s*s/i)?.[1] ?? "0", 10);
    return d * 86400 + h * 3600 + m * 60 + s;
  }

  // Colon-separated: "HH:MM:SS" or "D:HH:MM:SS"
  const parts = uptime.split(":").map((p) => parseInt(p.trim(), 10));
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
  }
  if (parts.length === 4) {
    const [d, h, m, s] = parts;
    return (d ?? 0) * 86400 + (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
  }

  // Fallback: try to extract any leading number as seconds
  const raw = parseInt(uptime, 10);
  return isNaN(raw) ? 0 : raw;
}

/** Format total seconds into a compact human-readable string. */
function formatUptime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "Just started";

  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Short label for inside the ring (2 lines max). */
function ringLabel(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function UptimeRing({ pct }: { pct: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="rotate-[-90deg]">
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        strokeWidth="6"
        className="stroke-zinc-200 dark:stroke-zinc-700"
      />
      {dash > 0 && (
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="stroke-blue-500"
        />
      )}
    </svg>
  );
}

export function SessionInfo({ interfaces, capturedAt }: SessionInfoProps) {
  if (interfaces.length === 0) return null;

  // Pick the interface with the longest uptime as the primary session
  const sorted = [...interfaces].sort(
    (a, b) => parseUptimeSeconds(b.uptime) - parseUptimeSeconds(a.uptime)
  );
  const primary = sorted[0]!;
  const primarySecs = parseUptimeSeconds(primary.uptime);

  // Ring fills over 24 h — gives a useful visual even for short sessions
  const ringPct = Math.min(100, (primarySecs / 86400) * 100);

  const totalErrors = interfaces.reduce(
    (sum, iface) => sum + iface.txErrors + iface.rxErrors,
    0
  );

  const capturedDate = new Date(capturedAt);
  const sessionStartApprox = primarySecs > 0
    ? new Date(capturedDate.getTime() - primarySecs * 1000)
    : null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Session Info
        </h3>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          WAN session uptime and connection health for the active interface.
        </p>
      </div>

      {/* Primary uptime + ring */}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <UptimeRing pct={ringPct} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold leading-tight text-center text-zinc-700 dark:text-zinc-200 whitespace-pre-line">
              {ringLabel(primarySecs)}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatUptime(primarySecs)}
          </span>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            Interface:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {primary.interface}
            </span>
          </p>
          {sessionStartApprox ? (
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              Est. connected since{" "}
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {sessionStartApprox.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              Session just started or router recently rebooted
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Interfaces
          </p>
          <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {interfaces.length}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Session Data
          </p>
          <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {formatBytes(primary.txBytes + primary.rxBytes).display}
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Errors
          </p>
          <p className={`mt-0.5 text-lg font-bold ${
            totalErrors > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}>
            {totalErrors > 0 ? totalErrors.toLocaleString() : "None"}
          </p>
        </div>
      </div>

      {/* Per-interface breakdown (only when more than one) */}
      {interfaces.length > 1 && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            All Interfaces
          </p>
          {sorted.map((iface) => {
            const secs = parseUptimeSeconds(iface.uptime);
            const pct = Math.min(100, (secs / (primarySecs || 1)) * 100);
            return (
              <div key={iface.interface} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {iface.interface}
                  </span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">
                    {formatUptime(secs)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
