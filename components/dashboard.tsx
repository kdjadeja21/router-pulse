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
import { ConnectedDevicesCard } from "./connected-devices-card";

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

  const lastUpdated = new Date(data.usage.capturedAt).toLocaleTimeString("en-US", {
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
          lastCapturedAt={data.usage.capturedAt}
          onRetry={handleRetry}
          onDismiss={dismissOfflineBanner}
        />
      )}

      <DashboardHeader
        routerModel={data.usage.routerModel}
        lastUpdated={lastUpdated}
        status={status}
        pollIntervalMs={pollIntervalMs}
        onIntervalChange={handleIntervalChange}
        onSetup={() => router.push("/setup")}
        hasStoredConfig={hasStoredConfig}
        onClearStorage={handleClearStorage}
      />

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <SummaryCards totals={data.usage.wan.totals} />

        <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 lg:grid-cols-2">
          <ConnectedDevicesCard devices={data.devices} />
          <RateDisplay txRate={rates.txRate} rxRate={rates.rxRate} peakRate={peakRate} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2 lg:items-stretch">
          <PacketSummaryDisplay packetSummary={data.usage.wan.packetSummary} />
          <SessionInfo interfaces={data.usage.wan.interfaces} capturedAt={data.usage.capturedAt} />
        </div>

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
          <InterfaceTable interfaces={data.usage.wan.interfaces} />
        </section>
      </div>
    </div>
  );
}
