import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const logoUrl = new URL("/qls-logo-transparent.svg", url.origin).toString();

  const icon = React.createElement(
    "div",
    {
      style: {
        width: "180px",
        height: "180px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050705",
        borderRadius: "34px",
        padding: "8px",
      },
    },
    React.createElement("img", {
      src: logoUrl,
      width: 164,
      height: 164,
      style: { objectFit: "contain" },
    })
  );

  return new ImageResponse(icon, {
    width: 180,
    height: 180,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
