import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import PwaRegister from "@/components/PwaRegister";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const isQLS = host === "qls.your-plan.com.au";
  const name = isQLS ? "QLS Portal" : BRAND.name;
  const appleIcon = isQLS ? "/qls-apple-touch-icon.png?v=6" : "/apple-touch-icon.png";

  return {
    title: { default: name, template: `%s | ${name}` },
    description: isQLS ? "Private Quality Landscape Solutions team portal." : BRAND.description,
    applicationName: name,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: appleIcon,
      apple: [{ url: appleIcon, sizes: "180x180", type: isQLS ? "image/jpeg" : "image/png" }],
    },
    appleWebApp: { capable: true, title: name, statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = { themeColor: BRAND.background };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="h-full"><body className="yourplan-theme min-h-full">{children}<PwaRegister /></body></html>;
}
