import type { MetadataRoute } from "next";

const HOME_ICON = "/5EAC5C26-D2E9-4219-8FB7-FDD38093BAFE.png?v=10";

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
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
