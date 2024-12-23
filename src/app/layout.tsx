import type { Metadata, Viewport } from "next";

import "./globals.css";
import { BASE_URL } from "@/lib/constants";
import TopNavigation from "@/components/top-navigation";

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
  themeColor: "#FFFFFF",
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
