import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { TopNavigation } from "@/components/top-navigation";

import type { Metadata } from "next";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={cn(inter.className)}>
        <TopNavigation />
        <div className="p-5">{children}</div>
      </body>
    </html>
  );
}
