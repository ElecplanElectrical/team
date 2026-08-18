import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

function logoDataUrl() {
  const file = readFileSync(path.join(process.cwd(), "public", "5EAC5C26-D2E9-4219-8FB7-FDD38093BAFE.png"));
  return `data:image/png;base64,${file.toString("base64")}`;
}

export default function Icon() {
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
          style={{
            position: "absolute",
            left: "-80px",
            top: "-80px",
            width: "672px",
            height: "672px",
          }}
        />
      </div>
    ),
    size,
  );
}
