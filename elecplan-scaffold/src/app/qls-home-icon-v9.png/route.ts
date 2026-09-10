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
          width: "512px",
          height: "512px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          padding: "22px",
        },
      },
      React.createElement("img", {
        src: logoUrl,
        width: 468,
        height: 468,
        style: { objectFit: "contain" },
      }),
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
}
