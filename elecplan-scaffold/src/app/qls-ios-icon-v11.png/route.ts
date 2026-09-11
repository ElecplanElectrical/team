import { ImageResponse } from "next/og";
import { createElement } from "react";

export const runtime = "edge";

const SOURCE_ICON = "https://qls.your-plan.com.au/qls-ios-icon-v10.png";

export async function GET() {
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
      src: SOURCE_ICON,
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
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
