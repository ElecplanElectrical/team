import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

function logoDataUrl() {
  const file = readFileSync(path.join(process.cwd(), "public", "5EAC5C26-D2E9-4219-8FB7-FDD38093BAFE.png"));
  return `data:image/png;base64,${file.toString("base64")}`;
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: "#000000",
        }}
      >
        <img
          src={logoDataUrl()}
          alt=""
          width={236}
          height={236}
          style={{
            position: "absolute",
            left: "-28px",
            top: "-28px",
            width: "236px",
            height: "236px",
          }}
        />
      </div>
    ),
    size,
  );
}
