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
        <div
          style={{
            width: "160px",
            height: "160px",
            backgroundImage: `url("${LOGO_MARK}")`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    ),
    size,
  );
}
