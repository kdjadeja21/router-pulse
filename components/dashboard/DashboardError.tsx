import { classifyError, getErrorInfo, ERROR_ICONS } from "@/utils/errorUtils";

interface DashboardErrorProps {
  error: string | null;
  onRetry: () => void;
  onSetup: () => void;
}

export function DashboardError({ error, onRetry, onSetup }: DashboardErrorProps) {
  const errInfo = getErrorInfo(error);
  const errorKind = classifyError(error ?? "");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
      Router Pulse
      </h1>

      <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
        <div className="mb-4 flex items-start gap-3">
          <span className="mt-0.5 text-2xl" aria-hidden>
            {ERROR_ICONS[errorKind]}
          </span>
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">{errInfo.title}</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errInfo.description}</p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-red-200/60 bg-red-100/50 px-4 py-3 dark:border-red-800/40 dark:bg-red-900/20">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">What to check</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errInfo.hint}</p>
        </div>

        {error && (
          <details className="mb-5 group">
            <summary className="cursor-pointer select-none text-xs text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-300">
              Technical details
            </summary>
            <p className="mt-2 rounded-md bg-red-100 px-3 py-2 font-mono text-xs text-red-700 break-all dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          </details>
        )}

        <div className="flex justify-end gap-3">
          {errInfo.showSetup && (
            <button
              onClick={onSetup}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              Open Setup
            </button>
          )}
          <button
            onClick={onRetry}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
