import type { PacketSummary } from "@/lib/types";
import { formatCount } from "@/lib/utils";

interface PacketSummaryProps {
  packetSummary: PacketSummary;
}

export function PacketSummaryDisplay({ packetSummary }: PacketSummaryProps) {
  const sent = packetSummary.sentPackets;
  const received = packetSummary.receivedPackets;
  const total = sent + received;
  const sentPercent = total > 0 ? Math.round((sent / total) * 100) : 0;
  const receivedPercent = total > 0 ? 100 - sentPercent : 0;
  const leadingLabel =
    sent === received ? "Balanced traffic" : sent > received ? "Upload heavy" : "Download heavy";
  const leadingColor =
    sent === received
      ? "text-zinc-600 dark:text-zinc-300"
      : sent > received
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-blue-700 dark:text-blue-300";
  const delta = Math.abs(sent - received);

  return (
    <div className="h-full rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Packets
          </h3>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Packet distribution and direction balance
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/50 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Sent
            </p>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {sentPercent}%
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCount(sent)}
          </p>
        </div>

        <div className="rounded-lg border border-blue-200/70 bg-blue-50/50 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
              Received
            </p>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {receivedPercent}%
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCount(received)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/70">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Traffic share</span>
          <span>{formatCount(delta)} packet difference</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-full bg-emerald-500" style={{ width: `${sentPercent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
          <span className="text-emerald-700 dark:text-emerald-300">Sent {sentPercent}%</span>
          <span className="text-blue-700 dark:text-blue-300">Received {receivedPercent}%</span>
        </div>
      </div>
    </div>
  );
}
