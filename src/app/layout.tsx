import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HazardPin",
  description: "Community road hazard reporter — pin it, verify it, fix it",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}