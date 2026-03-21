export interface FormattedBytes {
  bytes: number;
  kb: number;
  mb: number;
  gb: number;
  display: string;
}

export interface DisplayData {
  sent: FormattedBytes;
  received: FormattedBytes;
  total: FormattedBytes;
}

export interface PacketSummary {
  sentPackets: number;
  receivedPackets: number;
}

export interface InterfaceEntry {
  interface: string;
  uptime: string;
  txPackets: number;
  rxPackets: number;
  txErrors: number;
  rxErrors: number;
  txBytes: number;
  rxBytes: number;
  totalBytes: number;
  display: DisplayData;
}

export interface WanTotals {
  txPackets: number;
  rxPackets: number;
  txBytes: number;
  rxBytes: number;
  totalBytes: number;
  display: DisplayData;
}

export interface WanData {
  packetSummary: PacketSummary;
  totals: WanTotals;
  interfaces: InterfaceEntry[];
}

export interface UsageData {
  routerModel: string;
  capturedAt: string;
  source?: {
    tab: string;
    tabConfig: string;
    trafficWan: string;
    packetSummary: string;
    interfaceUsage: string;
  };
  wan: WanData;
}

export interface UsageApiResponse {
  usage: UsageData;
  devices: ConnectedDevicesData;
}

export interface RouterSession {
  cookieHeader: string;
  defaultHeaders: Record<string, string>;
}

// Shared API types — used by both API routes and client components

export type FilterRange = "today" | "7d" | "30d" | "month" | "year" | "custom";

export interface StatDelta {
  sent: number;
  received: number;
  total: number;
}

export interface StatsResponse {
  today: StatDelta;
  thisMonth: StatDelta;
  thisYear: StatDelta;
  avgDaily: StatDelta;
}

export interface DailyRecord {
  id: string;
  date: string;
  totalSent: number;
  totalReceived: number;
  txBytes: number;
  rxBytes: number;
  sessionCount: number;
  firstSnapshotAt: string;
  lastSnapshotAt: string;
}

export interface RecordsResponse {
  records: DailyRecord[];
  totalRecords: number;
  totals: { totalSent: number; totalReceived: number };
  range: FilterRange;
  dateRange: { start: string; end: string };
}

export interface ConnectedDevice {
  name: string;
  mac: string;
  ip: string;
  signal: string;
  connectionType: string;
}

export interface ConnectedDevicesData {
  devices_2g: ConnectedDevice[];
  devices_5g: ConnectedDevice[];
  all_devices: ConnectedDevice[];
}
