import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

const SOURCE = "https://team.elecplan.com.au/478BD26B-D7A4-4BD0-A823-186BE3EFDB94.png?v=5";

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
            left: "-34px",
            top: "-88px",
            width: "248px",
            height: "378px",
          }}
        />
      </div>
    ),
    size,
  );
}
