import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.hostname)
    .split(",")[0]
    .split(":")[0]
    .trim()
    .toLowerCase();

  if (host === "qls.your-plan.com.au") {
    const qlsIcon = new URL("/qls-ios-icon-v12.png?v=15", url.origin);
    const response = await fetch(qlsIcon, { cache: "no-store" });
    if (!response.ok) return new Response("QLS icon unavailable", { status: 502 });
    const bytes = await response.arrayBuffer();
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }

  const svg = React.createElement(
    "svg",
    { width: 180, height: 180, viewBox: "0 0 888 888", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement("rect", { width: 888, height: 888, rx: 160, fill: "#04B1FC" }),
    React.createElement("path", {
      fill: "#fff",
      fillRule: "evenodd",
      d: "M445,304 391,305 296,475 205,304 153,304 272,521 220,617 270,617Z M706,322 679,305 645,294 570,292 509,308 459,347 456,617 500,617 501,518 561,534 633,533 685,517 722,487 742,443 743,390 730,350Z M500,370 524,350 560,337 610,334 649,342 676,357 697,385 697,441 675,470 642,486 581,493 532,484 500,465Z",
    })
  );

  return new ImageResponse(svg, {
    width: 180,
    height: 180,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
