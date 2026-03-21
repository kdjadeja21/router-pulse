"use client";

import { useEffect, useRef, useState } from "react";

import { formatRate } from "@/lib/utils";

interface RateDisplayProps {
  txRate: number;
  rxRate: number;
  peakRate: number;
}

function ThroughputRow({
  label,
  rate,
  maxRate,
  direction,
  fillClass,
}: {
  label: string;
  rate: number;
  maxRate: number;
  direction: "up" | "down";
  fillClass: string;
}) {
  const safeMax = Math.max(maxRate, 1);
  const percent = Math.min(100, (rate / safeMax) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          <span className="rounded-full bg-zinc-200/80 p-1.5 text-zinc-700 dark:bg-zinc-700/70 dark:text-zinc-200">
            {direction === "up" ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="m5 12 7 7 7-7" />
              </svg>
            )}
          </span>
          <span>{label}</span>
        </div>
        <span className="min-w-[7.5ch] text-right font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
          {formatRate(rate)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-300/65 dark:bg-zinc-700/55">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${fillClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function RateDisplay({ txRate, rxRate, peakRate }: RateDisplayProps) {
  const totalRate = txRate + rxRate;
  const [animatedTotal, setAnimatedTotal] = useState(totalRate);
  const previousTotalRef = useRef(totalRate);

  useEffect(() => {
    const from = previousTotalRef.current;
    const to = totalRate;

    if (from === to) return;

    const start = performance.now();
    const duration = 550;
    let rafId = 0;

    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * eased;
      setAnimatedTotal(value);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        previousTotalRef.current = to;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [totalRate]);

  return (
    <div className="group relative h-full overflow-hidden rounded-[18px] border border-zinc-200/80 bg-zinc-50/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)] dark:border-zinc-700/60 dark:bg-zinc-900/85 dark:ring-zinc-700/40">
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-300/10" />
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Throughput
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Current upload and download speed
        </p>
      </div>

      <div className="mt-4 space-y-2 text-center">
        <p className="text-[2.1rem] font-semibold leading-none tracking-tight text-zinc-950 dark:text-zinc-50">
          {formatRate(animatedTotal)}
        </p>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Total Traffic
        </p>
        <div className="sparkline-wrap">
          <svg
            viewBox="0 0 320 44"
            className="h-7 w-full"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="throughputSpark" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgb(245 158 11 / 0)" />
                <stop offset="22%" stopColor="rgb(245 158 11 / 0.65)" />
                <stop offset="80%" stopColor="rgb(251 191 36 / 0.75)" />
                <stop offset="100%" stopColor="rgb(245 158 11 / 0)" />
              </linearGradient>
            </defs>
            <path
              className="sparkline-path"
              d="M0 26 C20 14 36 18 54 24 C70 30 86 34 102 26 C119 18 132 8 150 14 C167 20 186 34 206 30 C224 26 236 10 252 14 C270 18 286 34 304 28 C312 24 316 22 320 20"
              fill="none"
              stroke="url(#throughputSpark)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        <ThroughputRow
          label="Upload"
          rate={txRate}
          maxRate={peakRate}
          direction="up"
          fillClass="bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_16px_-6px_rgba(16,185,129,0.9)] dark:from-emerald-400 dark:to-green-300 dark:shadow-[0_0_18px_-5px_rgba(74,222,128,0.8)]"
        />
        <ThroughputRow
          label="Download"
          rate={rxRate}
          maxRate={peakRate}
          direction="down"
          fillClass="bg-gradient-to-r from-blue-500 to-indigo-400 shadow-[0_0_16px_-6px_rgba(59,130,246,0.85)] dark:from-sky-400 dark:to-blue-300 dark:shadow-[0_0_18px_-5px_rgba(56,189,248,0.8)]"
        />
      </div>

      <style jsx>{`
        .sparkline-wrap {
          position: relative;
          overflow: hidden;
          border-radius: 9999px;
          background: linear-gradient(
            to right,
            rgb(251 191 36 / 0.06),
            rgb(245 158 11 / 0.15),
            rgb(251 191 36 / 0.06)
          );
          filter: drop-shadow(0 0 8px rgb(245 158 11 / 0.25));
        }

        :global(.dark) .sparkline-wrap {
          background: linear-gradient(
            to right,
            rgb(251 191 36 / 0.1),
            rgb(245 158 11 / 0.2),
            rgb(251 191 36 / 0.1)
          );
          filter: drop-shadow(0 0 10px rgb(251 191 36 / 0.35));
        }

        .sparkline-path {
          stroke-dasharray: 7 9;
          animation: drift 5.5s linear infinite;
        }

        @keyframes drift {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -64;
          }
        }
      `}</style>
    </div>
  );
}
