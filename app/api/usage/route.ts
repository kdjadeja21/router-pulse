import { NextRequest, NextResponse } from "next/server";
import { getRouterClient } from "@/lib/router-client";
import { usageRateLimiter } from "@/lib/rate-limiter";

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
    const usageData = await client.fetchUsageData();

    usageRateLimiter.updateCache(LOCAL_RATE_LIMIT_KEY, usageData);

    return NextResponse.json(usageData, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching router usage:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch usage data";
    const status =
      (error as { status?: number })?.status === 403 ? 403 : 500;
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
