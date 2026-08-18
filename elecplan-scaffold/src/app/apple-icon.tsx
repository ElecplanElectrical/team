import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

const SOURCE = "https://team.elecplan.com.au/5EAC5C26-D2E9-4219-8FB7-FDD38093BAFE.png?v=11";

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
          src={SOURCE}
          alt=""
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
