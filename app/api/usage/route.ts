import { NextRequest, NextResponse } from "next/server";
import * as http from "http";
import { getRouterClient } from "@/lib/router-client";
import { usageRateLimiter } from "@/lib/rate-limiter";
import type { ConnectedDevice, GuestWifiData } from "@/lib/types";

const USAGE_MIN_GAP_MS = 10_000;
const LOCAL_RATE_LIMIT_KEY = "local";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getEnvConfig() {
  const baseUrl = process.env.ROUTER_BASE_URL;
  const username = process.env.ROUTER_USERNAME;
  const password = process.env.ROUTER_PASSWORD;
  const routerModel = process.env.ROUTER_MODEL;

  if (!baseUrl || !username || !password) return null;
  return { baseUrl, username, password, routerModel };
}

async function requestWithInsecureParser(
  url: string,
  headers?: Record<string, string>,
  body?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const method = body ? "POST" : "GET";
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        ...headers,
        ...(body && { "Content-Type": "application/x-www-form-urlencoded" }),
      },
      insecureHTTPParser: true,
    };

    http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 400) {
          const error = new Error(
            `Request failed with status ${res.statusCode} for ${url}`
          ) as Error & { status?: number };
          error.status = res.statusCode;
          reject(error);
        } else {
          resolve(data);
        }
      });
    })
      .on("error", (err) => {
        reject(err);
      })
      .end(body);
  });
}

function parseDevicesResponse(rawData: string): ConnectedDevice[] {
  if (!rawData || typeof rawData !== "string" || rawData.trim() === "") {
    return [];
  }

  try {
    // First attempt: try to parse as strict JSON
    const parsed = JSON.parse(rawData);
    return normalizeDevices(parsed);
  } catch {
    // Second attempt: try to extract JSON-like structures
    const jsonMatch = rawData.match(/({[\s\S]*}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return normalizeDevices(parsed);
      } catch {
        // Continue to next attempt
      }
    }

    // Third attempt: Extract from text/HTML if it contains device info
    if (
      rawData.includes("mac") ||
      rawData.includes("MAC") ||
      rawData.includes("ip")
    ) {
      return extractDevicesFromHTML(rawData);
    }

    return [];
  }
}

function normalizeDevices(data: unknown): ConnectedDevice[] {
  const normalized: ConnectedDevice[] = [];

  let rawDevices: unknown[] = [];
  if (Array.isArray(data)) {
    rawDevices = data;
  } else if (typeof data === "object" && data !== null) {
    const keys = [
      "devices",
      "data",
      "stations",
      "list",
      "stationList",
      "wlan_staionInfo_list",
    ];
    for (const k of keys) {
      if (Array.isArray((data as Record<string, unknown>)[k])) {
        rawDevices = (data as Record<string, unknown>)[k] as unknown[];
        break;
      }
    }
    if (rawDevices.length === 0) {
      rawDevices = Object.values(data).filter(
        (v) => typeof v === "object" && v !== null
      );
    }
  }

  for (const item of rawDevices) {
    if (typeof item === "object" && item !== null) {
      const device = item as Record<string, unknown>;
      normalized.push({
        name:
          (device.name as string) ||
          (device.hostname as string) ||
          (device.hostName as string) ||
          (device.devName as string) ||
          "Unknown",
        mac: (device.mac as string) || (device.macAddr as string) || (device.MAC as string) || "",
        ip: (device.ip as string) || (device.ipAddr as string) || (device.IP as string) || "",
        signal: (device.signal as string) || (device.rssi as string) || (device.Signal as string) || "",
        connectionType:
          (device.connectionType as string) ||
          (device.type as string) ||
          (device.connType as string) ||
          "Wifi",
      });
    }
  }

  return normalized;
}

function extractDevicesFromHTML(html: string): ConnectedDevice[] {
  const devices: ConnectedDevice[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1].trim());
    }

    if (cells.length >= 3) {
      const macCandidates = cells[1].match(
        /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/
      );
      if (macCandidates) {
        const mac = macCandidates[0].toUpperCase();
        const signal = cells[2] || "";

        devices.push({
          name: "Unknown",
          mac,
          ip: "",
          signal,
          connectionType: "Wifi",
        });
      }
    }
  }

  return devices;
}

/** First More AP row (# column = 1) is guest; Active column uses i_active_on.gif / i_active_off.gif; SSID is third column. */
function parseGuestFirstMoreApRow(html: string): { active: boolean; ssid: string } {
  const empty = { active: false, ssid: "" };
  if (!html || typeof html !== "string") return empty;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1]);
    }
    if (cells.length < 3) continue;

    const firstText = cells[0].replace(/<[^>]+>/g, "").trim();
    if (!/^\s*1\s*$/.test(firstText)) continue;

    const active = /i_active_on\.gif/i.test(cells[1]);
    const ssid = cells[2].replace(/<[^>]+>/g, "").trim();
    return { active, ssid };
  }

  return empty;
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

interface LanStatusRow {
  interface: string;
  status: string;
  rate: string;
}

function parseStatusView(html: string): LanStatusRow[] {
  if (!html || typeof html !== "string") return [];

  const rows: LanStatusRow[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    if (cells.length < 2) continue;

    const interfaceName = cells[0];
    const status = cells[1];
    const rate = cells[2] ?? "";

    if (!interfaceName || /interface\s*status/i.test(interfaceName)) continue;

    rows.push({ interface: interfaceName, status, rate });
  }

  return rows;
}

function extractUpLanNames(rows: LanStatusRow[]): string[] {
  return rows
    .filter((row) => /^lan\d+/i.test(row.interface.trim()) && /up/i.test(row.status.trim()))
    .map((row) => row.interface.trim());
}

async function fetchLanStatus(
  baseUrl: string,
  authHeaders: Record<string, string>
): Promise<{ all: LanStatusRow[]; up: string[] }> {
  const statusUrl = `${baseUrl}/cgi-bin/statusview.cgi`;
  try {
    const html = await requestWithInsecureParser(statusUrl, authHeaders);
    const all = parseStatusView(html);
    return { all, up: extractUpLanNames(all) };
  } catch (error) {
    console.warn("Could not fetch statusview CGI:", error);
    return { all: [], up: [] };
  }
}

function emptyGuestWifiData(): GuestWifiData {
  return {
    active_2g: false,
    active_5g: false,
    anyActive: false,
    ssid_2g: "",
    ssid_5g: "",
    devices_2g: [],
    devices_5g: [],
    all_devices: [],
  };
}

async function fetchGuestWifiData(
  baseUrl: string,
  authHeaders: Record<string, string>
): Promise<GuestWifiData> {
  const defaultHeaders = {
    ...authHeaders,
    Referer: `${baseUrl}/cgi-bin/login_advance.cgi`,
  };

  const more2 = `${baseUrl}/cgi-bin/wlan_moreAP.cgi`;
  const more5 = `${baseUrl}/cgi-bin/wlan5_moreAP.cgi`;

  let html2g = "";
  let html5g = "";
  try {
    [html2g, html5g] = await Promise.all([
      requestWithInsecureParser(more2, defaultHeaders),
      requestWithInsecureParser(more5, defaultHeaders),
    ]);
  } catch (error) {
    console.error("Error fetching guest moreAP pages:", error);
    return emptyGuestWifiData();
  }

  const row2 = parseGuestFirstMoreApRow(html2g);
  const row5 = parseGuestFirstMoreApRow(html5g);
  const active_2g = row2.active;
  const active_5g = row5.active;

  const fetchGuestList = async (url: string): Promise<ConnectedDevice[]> => {
    try {
      const data = await requestWithInsecureParser(url, defaultHeaders);
      return parseDevicesResponse(data);
    } catch (error) {
      console.error(`Error fetching guest devices from ${url}:`, error);
      return [];
    }
  };

  const list2 = `${baseUrl}/cgi-bin/wlan_staionInfo_list1.cgi`;
  const list5 = `${baseUrl}/cgi-bin/wlan5_staionInfo_list1.cgi`;

  const [devices_2g, devices_5g] = await Promise.all([
    active_2g ? fetchGuestList(list2) : Promise.resolve([] as ConnectedDevice[]),
    active_5g ? fetchGuestList(list5) : Promise.resolve([] as ConnectedDevice[]),
  ]);

  const anyActive = active_2g || active_5g;
  return {
    active_2g,
    active_5g,
    anyActive,
    ssid_2g: row2.ssid,
    ssid_5g: row5.ssid,
    devices_2g,
    devices_5g,
    all_devices: [...devices_2g, ...devices_5g],
  };
}

async function fetchDevices(
  baseUrl: string,
  authHeaders: Record<string, string>
) {
  const endpoints = {
    devices_2g: `${baseUrl}/cgi-bin/wlan_staionInfo_list.cgi`,
    devices_5g: `${baseUrl}/cgi-bin/wlan5_staionInfo_list.cgi`,
  };

  const defaultHeaders = {
    ...authHeaders,
    Referer: `${baseUrl}/cgi-bin/login_advance.cgi`,
  };

  const fetchDevicesFromEndpoint = async (
    endpoint: string
  ): Promise<ConnectedDevice[]> => {
    try {
      const data = await requestWithInsecureParser(endpoint, defaultHeaders);
      return parseDevicesResponse(data);
    } catch (error) {
      console.error(`Error fetching devices from ${endpoint}:`, error);
      return [];
    }
  };

  const [devices_2g, devices_5g] = await Promise.all([
    fetchDevicesFromEndpoint(endpoints.devices_2g),
    fetchDevicesFromEndpoint(endpoints.devices_5g),
  ]);

  return {
    devices_2g,
    devices_5g,
    all_devices: [...devices_2g, ...devices_5g],
  };
}

export async function GET(req: NextRequest) {
  const allowed = usageRateLimiter.check(LOCAL_RATE_LIMIT_KEY, USAGE_MIN_GAP_MS);
  if (!allowed) {
    const cached = usageRateLimiter.getCached(LOCAL_RATE_LIMIT_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Rate-Limited": "true",
        },
      });
    }
    return NextResponse.json(
      { error: "Too many requests. Please wait before polling again.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // Prefer inline config from X-Router-Config header (set by client from localStorage)
  const inlineConfigHeader = req.headers.get("X-Router-Config");
  let config: { baseUrl: string; username: string; password: string; routerModel?: string } | null = null;

  if (inlineConfigHeader) {
    try {
      const parsed = JSON.parse(inlineConfigHeader) as {
        baseUrl?: string;
        username?: string;
        password?: string;
        model?: string;
      };
      if (!parsed.baseUrl || !parsed.username || !parsed.password) {
        return NextResponse.json(
          { error: "Inline router config is incomplete.", code: "NO_CONFIG" },
          { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
        );
      }
      config = {
        baseUrl: parsed.baseUrl,
        username: parsed.username,
        password: parsed.password,
        routerModel: parsed.model,
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid X-Router-Config header.", code: "NO_CONFIG" },
        { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }
  } else {
    // Fall back to environment variables
    config = getEnvConfig();
  }

  if (!config) {
    return NextResponse.json(
      { error: "Router not configured. Please complete setup.", code: "NO_CONFIG" },
      { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  try {
    const client = getRouterClient(config);
    
    // Fetch usage data
    const usageData = await client.fetchUsageData();
    
    const session = await client.loginRouter(config);
    const [devicesData, guest, lanStatus] = await Promise.all([
      fetchDevices(config.baseUrl, session.defaultHeaders),
      fetchGuestWifiData(config.baseUrl, session.defaultHeaders),
      fetchLanStatus(config.baseUrl, session.defaultHeaders),
    ]);

    const responseData = {
      usage: usageData,
      devices: devicesData,
      guest,
      lanStatus,
    };

    usageRateLimiter.updateCache(LOCAL_RATE_LIMIT_KEY, responseData);

    return NextResponse.json(responseData, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching router data:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch router data";
    const status =
      (error as { status?: number })?.status === 403 ? 403 : 500;
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
