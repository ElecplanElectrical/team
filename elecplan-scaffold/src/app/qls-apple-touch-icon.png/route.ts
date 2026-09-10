import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const response = await fetch(new URL("/qls-logo-transparent.svg", origin), { cache: "no-store" });
  const svg = await response.text();
  const blackBackedSvg = svg.replace(/<svg([^>]*)>/, '<svg$1><rect width="100%" height="100%" fill="#000000"/>');
  return new NextResponse(blackBackedSvg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
