import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
export default function manifest(): MetadataRoute.Manifest {
  return { name: BRAND.name, short_name: BRAND.shortName, description: BRAND.description, start_url: "/", display: "standalone", background_color: BRAND.background, theme_color: BRAND.background };
}
