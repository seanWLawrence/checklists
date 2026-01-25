import type { Metadata, Viewport } from "next";

import { SerwistProvider } from "@/app/lib/client";
import { BASE_URL } from "@/lib/constants";
import TopNavigation from "@/components/top-navigation";

import "./globals.css";
import "highlight.js/styles/tokyo-night-dark.css";
import { ThemeSetter } from "@/components/theme-setter.client";
import { AuthRefreshInterval } from "@/components/auth-refresh-interval.client";

const APP_NAME = "SL";
const APP_DEFAULT_TITLE = "SL";
const APP_TITLE_TEMPLATE = "%s - App";
const APP_DESCRIPTION = "Lifestyle app";

export const metadata: Metadata = {
  metadataBase: BASE_URL,
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">
          <ThemeSetter />
          <AuthRefreshInterval />
          <TopNavigation />
          <div className="p-5">{children}</div>
        </SerwistProvider>
      </body>
    </html>
  );
}
