import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

const SOURCE = "https://team.elecplan.com.au/478BD26B-D7A4-4BD0-A823-186BE3EFDB94.png?v=5";

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
          src={SOURCE}
          alt=""
          style={{
            position: "absolute",
            left: "-97px",
            top: "-250px",
            width: "706px",
            height: "1075px",
          }}
        />
      </div>
    ),
    size,
  );
}
