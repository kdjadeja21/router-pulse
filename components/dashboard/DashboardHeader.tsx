import { StatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { POLL_OPTIONS } from "@/hooks/useDashboard";
import type { DashboardStatus } from "@/hooks/useDashboard";

interface DashboardHeaderProps {
  routerModel: string;
  lastUpdated: string;
  status: DashboardStatus;
  pollIntervalMs: number;
  onIntervalChange: (value: number) => void;
  onSetup: () => void;
  hasStoredConfig: boolean;
  onClearStorage: () => void;
}

export function DashboardHeader({
  routerModel,
  lastUpdated,
  status,
  pollIntervalMs,
  onIntervalChange,
  onSetup,
  hasStoredConfig,
  onClearStorage,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/50 bg-zinc-50/80 px-4 py-4 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {routerModel} WAN Dashboard
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
              Last updated {lastUpdated}
            </p>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Refresh every</span>
              <select
                value={pollIntervalMs}
                onChange={(e) => onIntervalChange(Number(e.target.value))}
                className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {POLL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <ThemeToggle />
          <UserMenu onSetup={onSetup} hasStoredConfig={hasStoredConfig} onClearStorage={onClearStorage} />
        </div>
      </div>
    </header>
  );
}
