import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vision Review",
  description: "AI-powered UI fidelity review tool for designers and design engineers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>{children}</body>
    </html>
  );
}
