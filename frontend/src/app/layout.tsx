import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miss South Carolina CY26 — Take Part Co Crew",
  description:
    "Run of Show for the Take Part Co video crew — Miss South Carolina CY26. Schedule, deliverables, interviews, delegates, contacts.",
  applicationName: "Take Part Co Crew",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TPC Crew",
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f0e6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
