import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deploymentIdentity() {
  return {
    platform: process.env.RAILWAY_PROJECT_ID ? "railway" : "unknown",
    project: process.env.RAILWAY_PROJECT_NAME ?? null,
    environment: process.env.RAILWAY_ENVIRONMENT_NAME ?? null,
    service: process.env.RAILWAY_SERVICE_NAME ?? null,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
    commitSha: process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
    branch: process.env.RAILWAY_GIT_BRANCH ?? null,
  };
}

export async function GET() {
  const deployment = deploymentIdentity();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ready", database: "ok", deployment },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "not_ready", database: "unavailable", deployment },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
