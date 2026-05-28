import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pothole Patrol",
  description: "Community road hazard reporting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
