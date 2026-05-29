import type { Metadata } from "next";

const SITE_URL = "https://hazardpin.moikapy.workers.dev";

export const metadata: Metadata = {
  title: "Report a Hazard",
  description:
    "Report a road hazard in your neighborhood. Pin potholes, debris, flooding, and other dangers on the map for your community.",
  alternates: {
    canonical: `${SITE_URL}/submit`,
  },
  openGraph: {
    title: "Report a Hazard | HazardPin",
    description:
      "Report a road hazard in your neighborhood. Pin potholes, debris, flooding, and other dangers on the map.",
    url: `${SITE_URL}/submit`,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Report a Hazard on HazardPin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Report a Hazard | HazardPin",
    description:
      "Report a road hazard in your neighborhood. Pin potholes, debris, flooding, and other dangers on the map.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}