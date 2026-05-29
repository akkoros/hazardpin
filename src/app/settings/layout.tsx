import type { Metadata } from "next";

const SITE_URL = "https://hazardpin.moikapy.workers.dev";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your HazardPin settings — reset your anonymous identity, toggle preferences, and configure your account.",
  alternates: {
    canonical: `${SITE_URL}/settings`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}