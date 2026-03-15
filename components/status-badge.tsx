type Status = "connected" | "loading" | "error" | "offline";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = {
    connected: {
      label: "Connected",
      dotClass: "bg-emerald-500 animate-pulse",
      textClass: "text-emerald-600 dark:text-emerald-400",
    },
    loading: {
      label: "Loading",
      dotClass: "bg-amber-500 animate-pulse",
      textClass: "text-amber-600 dark:text-amber-400",
    },
    error: {
      label: "Error",
      dotClass: "bg-red-500",
      textClass: "text-red-600 dark:text-red-400",
    },
    offline: {
      label: "Offline",
      dotClass: "bg-zinc-400",
      textClass: "text-zinc-500 dark:text-zinc-400",
    },
  };

  const { label, dotClass, textClass } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${textClass} ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${dotClass}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
