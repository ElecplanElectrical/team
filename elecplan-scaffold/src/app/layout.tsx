import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import PwaRegister from "@/components/PwaRegister";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const rawHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const host = rawHost.split(",")[0].split(":")[0].trim().toLowerCase();
  const isQLS = host === "qls.your-plan.com.au";
  const name = isQLS ? "QLS Portal" : BRAND.name;
  const appleIcon = isQLS ? "/qls-ios-icon-v10.png?v=18" : "/apple-touch-icon.png";

  return {
    title: { default: name, template: `%s | ${name}` },
    description: isQLS ? "Private Quality Landscape Solutions team portal." : BRAND.description,
    applicationName: name,
    manifest: isQLS ? "/qls-manifest-v8.webmanifest?v=18" : "/manifest.webmanifest",
    icons: {
      icon: appleIcon,
      shortcut: appleIcon,
      apple: [{ url: appleIcon, sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: { capable: true, title: name, statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = { themeColor: BRAND.background };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="h-full"><body className="yourplan-theme min-h-full">{children}<PwaRegister /></body></html>;
}
