import TopNavigation from "@/components/top-navigation";

import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sean | App",
  description: "Cool stuff",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TopNavigation />
        <div className="p-5">{children}</div>
      </body>
    </html>
  );
}
