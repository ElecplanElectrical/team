import { ImageResponse } from "next/og";
import { LOGO_MARK } from "@/lib/logo";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07131f",
        }}
      >
        <img
          src={LOGO_MARK}
          alt=""
          width="160"
          height="160"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    size,
  );
}
