import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elecplan",
  description: "Elecplan job management portal",
  applicationName: "Elecplan Team",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/elecplan-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/elecplan-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/elecplan-icon-192.png", type: "image/png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    title: "Elecplan",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#07131f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
