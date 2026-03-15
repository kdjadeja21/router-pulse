import crypto from "crypto";
import type { UsageData, RouterSession, InterfaceEntry } from "./types";
import { withDisplay } from "./utils";

const TRAFFIC_TAB_PATH = "../html/pages/systemMonitoring/trafficStatus/tab.json";

export interface RouterConfig {
  baseUrl?: string;
  username?: string;
  password?: string;
  routerModel?: string;
}

function getConfig(overrides?: RouterConfig) {
  const baseUrl = overrides?.baseUrl ?? process.env.ROUTER_BASE_URL ?? "http://192.168.1.1";
  const username = overrides?.username ?? process.env.ROUTER_USERNAME ?? "admin";
  const password = overrides?.password ?? process.env.ROUTER_PASSWORD ?? "";
  const routerModel = overrides?.routerModel ?? process.env.ROUTER_MODEL ?? "AOT5221ZY";

  return {
    baseUrl,
    username,
    password,
    routerModel,
    endpoints: {
      login: `${baseUrl}/cgi-bin/login_advance.cgi`,
      index: `${baseUrl}/cgi-bin/indexmain.cgi`,
      trafficTab: `${baseUrl}/cgi-bin/tabFW.cgi?tabJson=${TRAFFIC_TAB_PATH}&&tabIndex=0`,
      trafficTabConfig: `${baseUrl}/html/pages/systemMonitoring/trafficStatus/tab.json`,
      trafficWanFrame1: `${baseUrl}/cgi-bin/traffic_wan_frame1.cgi`,
      trafficWanFrame2: `${baseUrl}/cgi-bin/traffic_wan_frame2.cgi`,
    },
  };
}

interface RequestResult {
  data: string | object;
  headers: Headers;
}

async function request(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = new Error(
      `Request failed with status ${response.status} for ${url}`
    ) as Error & { status?: number; url?: string };
    error.status = response.status;
    error.url = url;
    throw error;
  }

  return response;
}

async function requestData(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    parseAs?: "text" | "json";
  } = {}
): Promise<RequestResult> {
  const {
    method = "GET",
    headers = {},
    body,
    parseAs = "text",
  } = options;

  const response = await request(url, {
    method,
    headers,
    body,
  });

  const data =
    parseAs === "json"
      ? ((await response.json()) as object)
      : await response.text();

  return {
    data,
    headers: response.headers,
  };
}

function getText(url: string, headers: Record<string, string> = {}) {
  return requestData(url, { headers });
}

function postForm(
  url: string,
  body: string,
  headers: Record<string, string> = {}
) {
  return requestData(url, { method: "POST", headers, body });
}

function extractSid(html: string): string {
  const match = html.match(/var sid = '([0-9a-f]+)'/i);

  if (!match) {
    throw new Error("Could not find the latest login SID.");
  }

  return match[1];
}

function buildCookieHeader(headers: Headers): string {
  const setCookies =
    "getSetCookie" in headers && typeof (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : [];

  return setCookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: unknown): number {
  const digits = String(value ?? "").replace(/[^\d-]/g, "");
  return digits ? Number(digits) : 0;
}

function parsePacketSummary(html: string): { sentPackets: number; receivedPackets: number } {
  const sentMatch = html.match(
    /Sent\s*:\s*<\/span>\s*<span>\s*<a[^>]*>([\d,]+)/i
  );
  const receivedMatch = html.match(
    /Received\s*:\s*<\/span>\s*<span>\s*<a[^>]*>([\d,]+)/i
  );

  return {
    sentPackets: parseNumber(sentMatch?.[1] ?? 0),
    receivedPackets: parseNumber(receivedMatch?.[1] ?? 0),
  };
}

interface ParsedInterface {
  interface: string;
  uptime: string;
  txPackets: number;
  txErrors: number;
  txBytes: number;
  rxPackets: number;
  rxErrors: number;
  rxBytes: number;
}

function parseInterfaceUsage(html: string): ParsedInterface[] {
  const rowRegex = /<tr\s+align="center">([\s\S]*?)<\/tr>/gi;
  const rows = [...html.matchAll(rowRegex)];

  return rows
    .map(([, rowHtml]) => {
      const cellRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [...(rowHtml?.matchAll(cellRegex) ?? [])].map(
        ([, cellHtml]) => stripTags(cellHtml ?? "")
      );

      if (cells.length < 9) {
        return null;
      }

      const interfaceName = cells[0];
      const uptime = cells[2];

      if (
        !interfaceName ||
        /Connected Interface|Data|Packets Sent|Packets Received/i.test(
          interfaceName
        )
      ) {
        return null;
      }

      return {
        interface: interfaceName,
        uptime,
        txPackets: parseNumber(cells[3]),
        txErrors: parseNumber(cells[4]),
        txBytes: parseNumber(cells[5]),
        rxPackets: parseNumber(cells[6]),
        rxErrors: parseNumber(cells[7]),
        rxBytes: parseNumber(cells[8]),
      };
    })
    .filter((r): r is ParsedInterface => r !== null);
}

function sumInterfaces(
  interfaces: ParsedInterface[]
): {
  txPackets: number;
  rxPackets: number;
  txBytes: number;
  rxBytes: number;
  txErrors: number;
  rxErrors: number;
} {
  return interfaces.reduce(
    (totals, entry) => ({
      txPackets: totals.txPackets + entry.txPackets,
      rxPackets: totals.rxPackets + entry.rxPackets,
      txBytes: totals.txBytes + entry.txBytes,
      rxBytes: totals.rxBytes + entry.rxBytes,
      txErrors: totals.txErrors + entry.txErrors,
      rxErrors: totals.rxErrors + entry.rxErrors,
    }),
    {
      txPackets: 0,
      rxPackets: 0,
      txBytes: 0,
      rxBytes: 0,
      txErrors: 0,
      rxErrors: 0,
    }
  );
}

function resolveRouterUrl(
  path: string,
  basePath: string
): string {
  return new URL(path, basePath).toString();
}

function isLoginPage(html: string): boolean {
  return (
    typeof html === "string" &&
    (html.includes('form name="passWarning"') ||
      html.includes("Please login device via latest login page.") ||
      html.includes("Welcome to the Web-Based Configurator"))
  );
}

function assertAuthenticatedHtml(html: string, url: string): void {
  if (isLoginPage(html)) {
    const error = new Error(
      `Router session expired while requesting ${url}`
    ) as Error & { code?: string; url?: string };
    error.code = "AUTH_EXPIRED";
    error.url = url;
    throw error;
  }
}

function shouldRetryWithLogin(error: unknown): boolean {
  const err = error as { code?: string; status?: number };
  return err?.code === "AUTH_EXPIRED" || err?.status === 403;
}

async function loginRouter(overrides?: RouterConfig): Promise<RouterSession> {
  const config = getConfig(overrides);
  const { baseUrl, username, password, endpoints } = config;

  const loginPageRes = await getText(endpoints.login, {
    Referer: `${baseUrl}/`,
  });

  const html = loginPageRes.data as string;
  const sid = extractSid(html);

  const encoded = encodeURIComponent(password).replace(
    /%[0-9A-F]{2}/g,
    (m) => m.toLowerCase()
  );

  const hash = crypto
    .createHash("md5")
    .update(encoded + ":" + sid)
    .digest("hex");

  const params = new URLSearchParams({
    Loginuser: username,
    LoginPasswordValue: hash,
    LoginSidValue: sid,
    submitValue: "1",
    Prestige_Login: "Login",
  });

  const loginRes = await postForm(endpoints.login, params.toString(), {
    "Content-Type": "application/x-www-form-urlencoded",
    Origin: baseUrl,
    Referer: endpoints.login,
  });

  const cookieHeader = buildCookieHeader(loginRes.headers);

  if (!cookieHeader || !(loginRes.data as string).includes("indexmain.cgi")) {
    throw new Error("Login failed. Router returned the login page again.");
  }

  const defaultHeaders: Record<string, string> = {
    Cookie: cookieHeader,
    Referer: endpoints.login,
  };

  const mainPageRes = await getText(endpoints.index, defaultHeaders);

  if ((mainPageRes.data as string).includes('form name="passWarning"')) {
    throw new Error("Session was not accepted by the router.");
  }

  return {
    cookieHeader,
    defaultHeaders,
  };
}

async function fetchUsageData(session?: RouterSession | null, overrides?: RouterConfig): Promise<UsageData> {
  const config = getConfig(overrides);
  const { baseUrl, routerModel, endpoints } = config;

  const activeSession = session ?? (await loginRouter(overrides));

  const fetchPage = async (
    url: string,
    referer: string,
    parseAs: "text" | "json" = "text"
  ): Promise<RequestResult> => {
    const response = await requestData(url, {
      headers: {
        ...activeSession.defaultHeaders,
        Referer: referer,
      },
      parseAs,
    });

    if (parseAs === "text") {
      assertAuthenticatedHtml(response.data as string, url);
    }

    return response;
  };

  await fetchPage(endpoints.trafficTab, endpoints.index);
  const tabConfigRes = await fetchPage(
    endpoints.trafficTabConfig,
    endpoints.trafficTab,
    "json"
  );

  const tabConfig = tabConfigRes.data as {
    MLG_Tab_subTitle_WAN?: { url?: string };
  };
  const wanPath = tabConfig?.MLG_Tab_subTitle_WAN?.url;

  if (!wanPath) {
    throw new Error(
      "Could not resolve the WAN traffic page from traffic status tab.json."
    );
  }

  const trafficWanUrl = resolveRouterUrl(
    wanPath,
    `${baseUrl}/cgi-bin/tabFW.cgi`
  );

  await fetchPage(trafficWanUrl, endpoints.trafficTab);

  const [packetSummaryRes, interfaceUsageRes] = await Promise.all([
    fetchPage(endpoints.trafficWanFrame1, trafficWanUrl),
    fetchPage(endpoints.trafficWanFrame2, trafficWanUrl),
  ]);

  const packetSummary = parsePacketSummary(
    packetSummaryRes.data as string
  );
  const interfaces = parseInterfaceUsage(interfaceUsageRes.data as string);

  if (interfaces.length === 0) {
    throw new Error(
      "Could not parse WAN usage rows from traffic_wan_frame2.cgi."
    );
  }

  const totals = sumInterfaces(interfaces);

  return {
    routerModel,
    capturedAt: new Date().toISOString(),
    source: {
      tab: endpoints.trafficTab,
      tabConfig: endpoints.trafficTabConfig,
      trafficWan: trafficWanUrl,
      packetSummary: endpoints.trafficWanFrame1,
      interfaceUsage: endpoints.trafficWanFrame2,
    },
    wan: {
      packetSummary,
      totals: withDisplay(totals.txBytes, totals.rxBytes, totals),
      interfaces: interfaces.map((entry) =>
        withDisplay(entry.txBytes, entry.rxBytes, entry) as InterfaceEntry
      ),
    },
  };
}

function createRouterClient(overrides?: RouterConfig) {
  let session: RouterSession | null = null;

  async function ensureSession(): Promise<RouterSession> {
    if (!session) {
      session = await loginRouter(overrides);
    }
    return session;
  }

  async function fetchUsageDataWithRetry(): Promise<UsageData> {
    const activeSession = await ensureSession();

    try {
      return await fetchUsageData(activeSession, overrides);
    } catch (error) {
      if (!shouldRetryWithLogin(error)) {
        throw error;
      }

      session = await loginRouter(overrides);
      return fetchUsageData(session, overrides);
    }
  }

  return {
    fetchUsageData: fetchUsageDataWithRetry,
  };
}

let routerClientSingleton: ReturnType<typeof createRouterClient> | null = null;

export function getRouterClient(overrides?: RouterConfig) {
  // When per-user overrides are provided, always create a fresh client
  if (overrides) {
    return createRouterClient(overrides);
  }
  if (!routerClientSingleton) {
    routerClientSingleton = createRouterClient();
  }
  return routerClientSingleton;
}
