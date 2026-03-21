import type { WanTotals } from "@/lib/types";

interface SummaryCardsProps {
  totals: WanTotals;
}

export function SummaryCards({ totals }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Sent",
      value: totals.display.sent.display,
      subtext: `${totals.txBytes.toLocaleString()} bytes`,
      gradient: "from-emerald-500/20 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/5",
      border: "border-emerald-500/30",
      icon: "↑",
    },
    {
      label: "Total Received",
      value: totals.display.received.display,
      subtext: `${totals.rxBytes.toLocaleString()} bytes`,
      gradient: "from-blue-500/20 to-blue-600/5 dark:from-blue-500/15 dark:to-blue-600/5",
      border: "border-blue-500/30",
      icon: "↓",
    },
    {
      label: "Grand Total",
      value: totals.display.total.display,
      subtext: `${totals.totalBytes.toLocaleString()} bytes`,
      gradient: "from-amber-500/20 to-amber-600/5 dark:from-amber-500/15 dark:to-amber-600/5",
      border: "border-amber-500/30",
      icon: "Σ",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`group relative overflow-hidden rounded-[18px] border border-zinc-200/80 bg-zinc-50/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)] dark:border-zinc-700/60 dark:bg-zinc-900/85 dark:ring-zinc-700/40 ${
            card.label === "Grand Total" ? "col-span-2 sm:col-span-1" : ""
          }`}
        >
          <div className={`pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-gradient-to-br ${card.gradient} blur-2xl`} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                {card.label}
              </p>
              <p className="mt-2 text-[2rem] font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {card.subtext}
              </p>
            </div>
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${card.border} bg-white/80 text-base text-zinc-700 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-200`}
              aria-hidden
            >
              {card.icon}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
