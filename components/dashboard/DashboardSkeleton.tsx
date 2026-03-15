import { StatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Router Pulse
          </h1>
          <div className="flex items-center gap-3">
            <StatusBadge status="loading" />
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-32" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>

        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-48" />
      </div>
    </div>
  );
}
