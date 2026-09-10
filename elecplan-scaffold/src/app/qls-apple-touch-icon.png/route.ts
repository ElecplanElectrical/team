import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const logoUrl = new URL("/qls-logo-transparent.svg", url.origin).toString();

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "180px",
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#040605",
          padding: "18px",
        },
      },
      React.createElement("img", {
        src: logoUrl,
        width: 144,
        height: 144,
        style: { objectFit: "contain" },
      })
    ),
    {
      width: 180,
      height: 180,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
