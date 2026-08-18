import { ImageResponse } from "next/og";
import { LOGO_MARK } from "@/lib/logo";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          width="452"
          height="452"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    size,
  );
}
