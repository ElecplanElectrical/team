import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s | ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: BRAND.background };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="h-full"><body className="min-h-full">{children}<PwaRegister /></body></html>;
}
