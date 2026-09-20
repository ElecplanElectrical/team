import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";
import "@/styles/recessed-carbon.css";
import "@/styles/portal-layout.css";

const HOME_ICON = "/5EAC5C26-D2E9-4219-8FB7-FDD38093BAFE.png?v=10";

export const metadata: Metadata = {
  title: "Elecplan",
  description: "Elecplan job management portal",
  applicationName: "Elecplan Team",
  manifest: "/manifest.webmanifest?v=10",
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
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={HOME_ICON} />
        <link rel="icon" type="image/png" href={HOME_ICON} />
      </head>
      <body className="ep-carbon min-h-full" data-elecplan-theme="recessed-carbon-10">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
