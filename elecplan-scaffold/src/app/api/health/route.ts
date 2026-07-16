import { NextResponse } from "next/server";

// Lightweight liveness probe for Railway's healthcheck. Intentionally does NOT
// touch the database — it reports that the web process is up and serving, so a
// transient DB blip doesn't cause the platform to kill an otherwise-healthy
// container. Middleware excludes /api/*, so this is reachable without a session.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
