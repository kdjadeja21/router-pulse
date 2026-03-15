"use client";

import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "./dashboard/DashboardSkeleton";
import { DashboardError } from "./dashboard/DashboardError";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { OfflineBanner } from "./dashboard/OfflineBanner";
import { SummaryCards } from "./summary-cards";
import { RateDisplay } from "./rate-display";
import { RateChart } from "./rate-chart";
import { InterfaceTable } from "./interface-table";
import { PacketSummaryDisplay } from "./packet-summary";
import { SessionInfo } from "./session-info";

export function Dashboard() {
  const router = useRouter();
  const {
    data,
    error,
    status,
    rates,
    chartData,
    peakRate,
    pollIntervalMs,
    offlineBannerDismissed,
    hasStoredConfig,
    handleIntervalChange,
    handleRetry,
    dismissOfflineBanner,
    handleClearStorage,
  } = useDashboard();

  if (status === "loading" && !data) return <DashboardSkeleton />;

  if (status === "error" && !data) {
    return (
      <DashboardError
        error={error}
        onRetry={handleRetry}
        onSetup={() => router.push("/setup")}
      />
    );
  }

  if (!data) return null;

  const lastUpdated = new Date(data.capturedAt).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {status === "offline" && !offlineBannerDismissed && (
        <OfflineBanner
          error={error}
          lastCapturedAt={data.capturedAt}
          onRetry={handleRetry}
          onDismiss={dismissOfflineBanner}
        />
      )}

      <DashboardHeader
        routerModel={data.routerModel}
        lastUpdated={lastUpdated}
        status={status}
        pollIntervalMs={pollIntervalMs}
        onIntervalChange={handleIntervalChange}
        onSetup={() => router.push("/setup")}
        hasStoredConfig={hasStoredConfig}
        onClearStorage={handleClearStorage}
      />

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <SummaryCards totals={data.wan.totals} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <RateDisplay txRate={rates.txRate} rxRate={rates.rxRate} peakRate={peakRate} />
          <PacketSummaryDisplay packetSummary={data.wan.packetSummary} />
        </div>

        <SessionInfo interfaces={data.wan.interfaces} capturedAt={data.capturedAt} />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Rate History
          </h2>
          <RateChart history={chartData} />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Interfaces
          </h2>
          <InterfaceTable interfaces={data.wan.interfaces} />
        </section>
      </div>
    </div>
  );
}
