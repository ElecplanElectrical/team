import type { MetadataRoute } from "next";

const HOME_ICON = "/478BD26B-D7A4-4BD0-A823-186BE3EFDB94.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elecplan Team",
    short_name: "Elecplan",
    description: "Elecplan job and field operations portal",
    start_url: "/calendar",
    display: "standalone",
    background_color: "#07131f",
    theme_color: "#07131f",
    orientation: "portrait-primary",
    icons: [
      {
        src: HOME_ICON,
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
