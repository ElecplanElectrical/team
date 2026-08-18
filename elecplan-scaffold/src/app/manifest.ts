import type { MetadataRoute } from "next";

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
        src: "/elecplan-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/elecplan-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
