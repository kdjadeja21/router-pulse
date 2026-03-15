import { formatRate } from "@/lib/utils";

interface RateDisplayProps {
  txRate: number;
  rxRate: number;
  peakRate: number;
}

function RateBar({
  label,
  rate,
  maxRate,
  colorClass,
}: {
  label: string;
  rate: number;
  maxRate: number;
  colorClass: string;
}) {
  const safeMax = Math.max(maxRate, 1);
  const percent = Math.min(100, (rate / safeMax) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className="font-mono text-zinc-600 dark:text-zinc-400">
          {formatRate(rate)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function RateDisplay({ txRate, rxRate, peakRate }: RateDisplayProps) {
  const totalRate = txRate + rxRate;
  const combinedPeak = peakRate * 2;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Live Rates
        </h3>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Current upload and download throughput measured between the two most recent polls. Bars scale to the session peak.
        </p>
      </div>
      <div className="space-y-4">
        <RateBar
          label="TX (Upload)"
          rate={txRate}
          maxRate={peakRate}
          colorClass="bg-emerald-500"
        />
        <RateBar
          label="RX (Download)"
          rate={rxRate}
          maxRate={peakRate}
          colorClass="bg-blue-500"
        />
        <RateBar
          label="Combined"
          rate={totalRate}
          maxRate={combinedPeak}
          colorClass="bg-amber-500"
        />
      </div>
    </div>
  );
}
