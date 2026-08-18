import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elecplan",
  description: "Elecplan job management portal",
  applicationName: "Elecplan Team",
  manifest: "/manifest.webmanifest?v=3",
  icons: {
    icon: [{ url: "/icon?v=3", type: "image/png" }],
    shortcut: ["/icon?v=3"],
    apple: [{ url: "/apple-icon?v=3", type: "image/png" }],
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
      <head>
        <link rel="apple-touch-icon" href="/apple-icon?v=3" />
        <link rel="icon" type="image/png" href="/icon?v=3" />
      </head>
      <body className="min-h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
