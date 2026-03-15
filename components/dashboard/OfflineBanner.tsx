import { classifyError, OFFLINE_BANNER_MESSAGES } from "@/utils/errorUtils";

interface OfflineBannerProps {
  error: string | null;
  lastCapturedAt: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export function OfflineBanner({ error, lastCapturedAt, onRetry, onDismiss }: OfflineBannerProps) {
  const errorKind = classifyError(error ?? "");

  const formattedTime = lastCapturedAt
    ? new Date(lastCapturedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "last session";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-amber-800 dark:text-amber-300">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <div>
              <p className="font-medium">{OFFLINE_BANNER_MESSAGES[errorKind]}</p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Showing last known data from{" "}
                <span className="font-medium">{formattedTime}</span>. Live updates will resume
                automatically when the router is back online.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRetry}
              className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
            >
              Retry
            </button>
            <button
              onClick={onDismiss}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
