import type { FormattedBytes, DisplayData } from "./types";

export function formatBytes(bytes: number): FormattedBytes {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return {
    bytes,
    kb: Number((bytes / 1024).toFixed(2)),
    mb: Number((bytes / 1024 ** 2).toFixed(2)),
    gb: Number((bytes / 1024 ** 3).toFixed(2)),
    display: `${value.toFixed(2)} ${units[unitIndex]}`,
  };
}

export function formatRate(bytesPerSecond: number): string {
  return `${formatBytes(Math.max(0, bytesPerSecond)).display}/s`;
}

export function formatCount(value: number): string {
  return Number(value || 0).toLocaleString("en-US");
}

export function withDisplay<T extends object>(
  txBytes: number,
  rxBytes: number,
  extra: T
): T & { totalBytes: number; display: DisplayData } {
  const totalBytes = txBytes + rxBytes;
  return {
    ...extra,
    txBytes,
    rxBytes,
    totalBytes,
    display: {
      sent: formatBytes(txBytes),
      received: formatBytes(rxBytes),
      total: formatBytes(totalBytes),
    },
  };
}
