import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Telecom Tower Design Explorer",
  description:
    "Literature-backed preliminary geometry explorer for wind-fragility pilot modeling."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
