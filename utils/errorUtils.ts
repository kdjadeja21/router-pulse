export type ErrorKind = "unreachable" | "auth" | "config" | "generic";

export interface ErrorInfo {
  title: string;
  description: string;
  hint: string;
  showSetup: boolean;
}

export const ERROR_ICONS: Record<ErrorKind, string> = {
  unreachable: "📡",
  auth: "🔐",
  config: "⚙️",
  generic: "⚠️",
};

export const OFFLINE_BANNER_MESSAGES: Record<ErrorKind, string> = {
  unreachable: "Router is unreachable — it may be powered off or restarting.",
  auth: "Router credentials are incorrect — live data paused.",
  config: "Router config mismatch — live data paused.",
  generic: "Router connection lost — live data paused.",
};

export function classifyError(message: string): ErrorKind {
  const m = message.toLowerCase();

  if (
    m.includes("fetch failed") ||
    m.includes("econnrefused") ||
    m.includes("econnreset") ||
    m.includes("etimedout") ||
    m.includes("network") ||
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("connection refused") ||
    m.includes("connection reset") ||
    m.includes("timed out") ||
    m.includes("request failed with status 5")
  ) {
    return "unreachable";
  }

  if (
    m.includes("login failed") ||
    m.includes("session was not accepted") ||
    m.includes("request failed with status 403") ||
    m.includes("auth_expired") ||
    m.includes("session expired")
  ) {
    return "auth";
  }

  if (
    m.includes("could not find the latest login sid") ||
    m.includes("could not resolve the wan traffic page") ||
    m.includes("could not parse wan usage rows") ||
    m.includes("request failed with status 4")
  ) {
    return "config";
  }

  return "generic";
}

export function getErrorInfo(message: string | null): ErrorInfo {
  const kind = classifyError(message ?? "");

  switch (kind) {
    case "unreachable":
      return {
        title: "Router Unreachable",
        description:
          "The app cannot connect to your router. It may be powered off, restarting, or on a different network.",
        hint: "Make sure your device is on the same network as the router and the router is powered on. If the IP address has changed, update it in Setup.",
        showSetup: true,
      };
    case "auth":
      return {
        title: "Login Failed",
        description:
          "The router rejected the credentials. The username or password saved in your config appears to be incorrect.",
        hint: "Double-check your router admin username and password in Setup. The default is usually admin / admin.",
        showSetup: true,
      };
    case "config":
      return {
        title: "Configuration Mismatch",
        description:
          "The app connected to the router but could not read usage data. The router model or base URL may be set incorrectly.",
        hint: "Verify the router base URL and model in Setup. Make sure the URL points to the router admin page (e.g. http://192.168.1.1).",
        showSetup: true,
      };
    default:
      return {
        title: "Something Went Wrong",
        description: message ?? "An unexpected error occurred while fetching router data.",
        hint: "Try retrying. If the problem persists, check your router config in Setup.",
        showSetup: true,
      };
  }
}
