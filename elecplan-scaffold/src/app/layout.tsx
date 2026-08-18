import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const HOME_ICON = "/478BD26B-D7A4-4BD0-A823-186BE3EFDB94.png?v=2";

export const metadata: Metadata = {
  title: "Elecplan",
  description: "Elecplan job management portal",
  applicationName: "Elecplan Team",
  manifest: "/manifest.webmanifest?v=2",
  icons: {
    icon: [{ url: HOME_ICON, type: "image/png" }],
    shortcut: [HOME_ICON],
    apple: [{ url: HOME_ICON, type: "image/png" }],
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
        <link rel="apple-touch-icon" href={HOME_ICON} />
        <link rel="icon" type="image/png" href={HOME_ICON} />
      </head>
      <body className="min-h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
