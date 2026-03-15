import type { InterfaceEntry } from "@/lib/types";
import { formatCount } from "@/lib/utils";

interface InterfaceTableProps {
  interfaces: InterfaceEntry[];
}

export function InterfaceTable({ interfaces }: InterfaceTableProps) {
  return (
    <div className="-mx-4 overflow-hidden border-y border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:mx-0 sm:rounded-xl sm:border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Interface
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Uptime
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Sent
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Received
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Total
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Packets
              </th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                Errors
              </th>
            </tr>
          </thead>
          <tbody>
            {interfaces.map((entry, index) => (
              <tr
                key={entry.interface}
                className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                  index % 2 === 1 ? "bg-zinc-50/50 dark:bg-zinc-900/30" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.interface}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {entry.uptime}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                  {entry.display.sent.display}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                  {entry.display.received.display}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                  {entry.display.total.display}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatCount(entry.txPackets + entry.rxPackets)}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {entry.txErrors + entry.rxErrors > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      {formatCount(entry.txErrors + entry.rxErrors)}
                    </span>
                  ) : (
                    formatCount(0)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
