import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { BRAND } from "@/lib/brand";
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const requestHeaders=await headers();
  const host=(requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"").split(":")[0].toLowerCase();
  if(host==="qls.your-plan.com.au")return {name:"Quality Landscape Solutions Team Portal",short_name:"QLS Portal",description:"Private Quality Landscape Solutions team portal.",start_url:"/dashboard",display:"standalone",background_color:"#040605",theme_color:"#040605",icons:[{src:"/qls-apple-touch-icon.png?v=6",sizes:"180x180",type:"image/jpeg",purpose:"any"}]};
  return { name: BRAND.name, short_name: BRAND.shortName, description: BRAND.description, start_url: "/login", display: "standalone", background_color: BRAND.background, theme_color: BRAND.background, icons:[{src:"/yourplan-app-icon.png?v=2",sizes:"180x180",type:"image/png",purpose:"any"}] };
}
