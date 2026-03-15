import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Returns whether the server-side env config is present and complete.
 * Used by the setup page to detect if credentials are missing from both
 * localStorage (client) and .env.local (server).
 */
export async function GET() {
  const hasEnvConfig = Boolean(
    process.env.ROUTER_BASE_URL &&
      process.env.ROUTER_USERNAME &&
      process.env.ROUTER_PASSWORD
  );

  return NextResponse.json(
    { hasEnvConfig },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
