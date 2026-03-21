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
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border bg-gradient-to-br ${card.gradient} p-6 shadow-sm transition-shadow hover:shadow-md ${card.border} ${
            card.label === "Grand Total" ? "col-span-2 sm:col-span-1" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {card.subtext}
              </p>
            </div>
            <span className="text-2xl font-light text-zinc-400 dark:text-zinc-500">
              {card.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
