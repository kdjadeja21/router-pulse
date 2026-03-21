"use client";

import { useEffect, useState } from "react";
import type { ConnectedDevicesData } from "@/lib/types";

interface ConnectedDevicesCardProps {
  devices: ConnectedDevicesData;
}

function useCountUp(target: number, duration = 550) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const start = value;
    const delta = target - start;
    if (delta === 0) return;

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(start + delta * eased));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, target, value]);

  return value;
}

export function ConnectedDevicesCard({ devices }: ConnectedDevicesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const devices2g = devices.devices_2g ?? [];
  const devices5g = devices.devices_5g ?? [];
  const allDevices = [
    ...devices2g.map((device) => ({ device, band: "2.4 GHz" as const })),
    ...devices5g.map((device) => ({ device, band: "5 GHz" as const })),
  ];

  const total = allDevices.length;
  const animatedTotal = useCountUp(total);
  const animated2g = useCountUp(devices2g.length);
  const animated5g = useCountUp(devices5g.length);

  const getSignalQuality = (signal: string): { label: string; tone: string } => {
    const number = Number.parseInt(signal.replace(/[^\d-]/g, ""), 10);
    if (Number.isNaN(number)) {
      return {
        label: signal ? "Unknown" : "N/A",
        tone: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
      };
    }

    if (number >= -55) {
      return { label: "Excellent", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" };
    }
    if (number >= -67) {
      return { label: "Good", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" };
    }
    if (number >= -75) {
      return { label: "Fair", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
    }
    return { label: "Weak", tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300" };
  };

  return (
    <section className="group relative h-full overflow-hidden rounded-[18px] border border-zinc-200/80 bg-zinc-50/90 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)] dark:border-zinc-800 dark:bg-zinc-900/75 dark:ring-zinc-700/40">
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/10" />

      <header className="relative">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-800 dark:text-zinc-200">
          Connected Devices
        </h3>
      </header>

      <div className="relative mt-5 flex flex-col items-center justify-center text-center">
        <p className="text-5xl font-bold leading-none tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
          {animatedTotal}
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Total Connected
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <article className="rounded-[13px] border border-indigo-200/60 bg-indigo-50/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-400/20 dark:bg-indigo-500/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">2.4 GHz</p>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-500 dark:text-indigo-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 9a13 13 0 0 1 18 0" />
              <path d="M6 12.5a9 9 0 0 1 12 0" />
              <path d="M9.5 16a5 5 0 0 1 5 0" />
              <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
            {animated2g}
          </p>
          <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">Better range</p>
        </article>

        <article className="rounded-[13px] border border-teal-200/70 bg-teal-50/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-teal-400/20 dark:bg-teal-500/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-teal-700 dark:text-teal-300">5 GHz</p>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-500 dark:text-teal-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
            </svg>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
            {animated5g}
          </p>
          <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">Better speed</p>
        </article>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-[12px] border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-expanded={isExpanded}
          aria-controls="connected-device-list"
        >
          <span>Device List</span>
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 text-zinc-500 transition-transform duration-300 dark:text-zinc-400 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m5 8 5 5 5-5" />
          </svg>
        </button>

        <div
          className={`grid transition-all duration-300 ease-out ${isExpanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div
              id="connected-device-list"
              className="max-h-80 overflow-auto rounded-xl border border-zinc-200/80 bg-white/90 p-3 dark:border-zinc-700 dark:bg-zinc-800/70"
            >
              {total === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No connected devices detected right now.
                </div>
              ) : (
                <ul className="space-y-2">
                  {allDevices.map(({ device, band }, index) => (
                    <li
                      key={`${band}-${device.mac || device.ip || "device"}-${index}`}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {device.name || "Unknown device"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                            IP: {device.ip || "N/A"} | MAC: {device.mac || "N/A"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            band === "2.4 GHz"
                              ? "border border-indigo-400/30 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/40 dark:text-indigo-300"
                              : "border border-teal-400/30 bg-teal-500/10 text-teal-700 dark:border-teal-400/40 dark:text-teal-300"
                          }`}
                        >
                          {band}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs">
                        {(() => {
                          const signalMeta = getSignalQuality(device.signal);
                          return (
                            <span className={`rounded-full px-2 py-0.5 font-medium ${signalMeta.tone}`}>
                              Signal: {signalMeta.label}
                            </span>
                          );
                        })()}
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {device.signal ? `(${device.signal})` : ""}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
