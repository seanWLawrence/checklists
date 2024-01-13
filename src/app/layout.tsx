import { TopNavigation } from "@/components/top-navigation";

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Checklists",
  description: "A simple checklist.",
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
