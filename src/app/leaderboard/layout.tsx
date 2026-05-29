import type { Metadata } from "next";

const SITE_URL = "https://hazardpin.moikapy.workers.dev";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top hazard reporters on HazardPin. See who's making the biggest impact in your community by reporting and verifying road hazards.",
  alternates: {
    canonical: `${SITE_URL}/leaderboard`,
  },
  openGraph: {
    title: "Leaderboard | HazardPin",
    description:
      "Top hazard reporters on HazardPin. See who's making the biggest impact in your community.",
    url: `${SITE_URL}/leaderboard`,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "HazardPin Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaderboard | HazardPin",
    description:
      "Top hazard reporters on HazardPin. See who's making the biggest impact in your community.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}