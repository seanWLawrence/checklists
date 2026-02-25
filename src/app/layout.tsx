import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { SerwistProvider } from "@/app/lib/client";
import { BASE_URL } from "@/lib/constants";
import TopNavigation from "@/components/top-navigation";
import { ServiceWorkerUpdateBanner } from "@/components/service-worker-update-banner.client";
import { ServiceWorkerDevReset } from "@/components/service-worker-dev-reset.client";

import "./globals.css";
import "highlight.js/styles/tokyo-night-dark.css";
import { AuthRefreshInterval } from "@/components/auth-refresh-interval.client";
import { RuntimeErrorMonitor } from "@/components/runtime-error-monitor.client";

const APP_NAME = "SL";
const APP_DEFAULT_TITLE = "SL";
const APP_TITLE_TEMPLATE = "%s - App";
const APP_DESCRIPTION = "Lifestyle app";
const THEME_COOKIE_KEY = "theme";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const override = process.env.NEXT_PUBLIC_THEME_OVERRIDE;
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE_KEY)?.value;

  const initialTheme =
    override === "light" || override === "dark" || override === "system"
      ? override
      : cookieTheme === "light" || cookieTheme === "dark" || cookieTheme === "system"
        ? cookieTheme
        : "light";
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html
      lang="en"
      className={initialTheme === "dark" ? "dark" : undefined}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <body>
        {isProduction ? (
          <SerwistProvider swUrl="/serwist/sw.js">
            <ServiceWorkerUpdateBanner />
            <RuntimeErrorMonitor />
            <AuthRefreshInterval />
            <TopNavigation />
            <div className="p-5">{children}</div>
          </SerwistProvider>
        ) : (
          <>
            <ServiceWorkerDevReset />
            <RuntimeErrorMonitor />
            <AuthRefreshInterval />
            <TopNavigation />
            <div className="p-5">{children}</div>
          </>
        )}
      </body>
    </html>
  );
}
