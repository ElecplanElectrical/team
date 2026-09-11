import { ImageResponse } from "next/og";
import { createElement } from "react";

export const runtime = "edge";

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const sourceResponse = await fetch(new URL("/qls-ios-icon-v10.png", origin), { cache: "no-store" });
  if (!sourceResponse.ok) return new Response("QLS icon unavailable", { status: 502 });

  const bytes = new Uint8Array(await sourceResponse.arrayBuffer());
  const source = `data:image/png;base64,${bytesToBase64(bytes)}`;

  const icon = createElement(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        width: "180px",
        height: "180px",
        background: "#000000",
        overflow: "hidden",
      },
    },
    createElement("img", {
      src: source,
      width: 180,
      height: 180,
      style: { position: "absolute", inset: 0, width: "180px", height: "180px" },
    }),
    createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "6px",
        background: "#000000",
      },
    }),
  );

  return new ImageResponse(icon, {
    width: 180,
    height: 180,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
}
