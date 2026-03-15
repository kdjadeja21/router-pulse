import type { PacketSummary } from "@/lib/types";
import { formatCount } from "@/lib/utils";

interface PacketSummaryProps {
  packetSummary: PacketSummary;
}

export function PacketSummaryDisplay({ packetSummary }: PacketSummaryProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Packets
      </h3>
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">Sent</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCount(packetSummary.sentPackets)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">Received</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCount(packetSummary.receivedPackets)}
          </p>
        </div>
      </div>
    </div>
  );
}
