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
    <section className="group relative h-full overflow-hidden rounded-[18px] border border-zinc-200/80 bg-zinc-50/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)] dark:border-zinc-700/60 dark:bg-zinc-900/85 dark:ring-zinc-700/40">
      <div className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-400/10" />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Packets
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Packet distribution and direction balance
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <article className="rounded-[13px] border border-emerald-200/70 bg-emerald-50/70 p-3.5 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              Sent
            </p>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {sentPercent}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700 tabular-nums dark:text-emerald-300">
            {formatCount(sent)}
          </p>
        </article>

        <article className="rounded-[13px] border border-blue-200/70 bg-blue-50/70 p-3.5 shadow-sm dark:border-blue-400/20 dark:bg-blue-500/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
              Received
            </p>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {receivedPercent}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-700 tabular-nums dark:text-blue-300">
            {formatCount(received)}
          </p>
        </article>
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-white/85 p-3 dark:border-zinc-700/80 dark:bg-zinc-800/70">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Traffic share</span>
          <span>{formatCount(delta)} packet difference</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-300/65 dark:bg-zinc-700/55">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${sentPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
          <span className="text-emerald-700 dark:text-emerald-300">Sent {sentPercent}%</span>
          <span className="text-blue-700 dark:text-blue-300">Received {receivedPercent}%</span>
        </div>
      </div>
      <p className={`mt-3 text-xs font-medium ${leadingColor}`}>{leadingLabel}</p>
    </section>
  );
}
