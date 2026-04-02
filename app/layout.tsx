import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthSync from "@/components/AuthSync";

export const metadata: Metadata = {
  title: "Coin2Win",
  description: "Coin2Win casino platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
