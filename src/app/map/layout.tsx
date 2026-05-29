import type { Metadata } from "next";

const SITE_URL = "https://hazardpin.moikapy.workers.dev";

export const metadata: Metadata = {
  title: "Hazard Map",
  description:
    "View all road hazards on an interactive map. Find potholes, debris, flooding, and other dangers near you on HazardPin.",
  alternates: {
    canonical: `${SITE_URL}/map`,
  },
  openGraph: {
    title: "Hazard Map | HazardPin",
    description:
      "View all road hazards on an interactive map. Find potholes, debris, flooding, and other dangers near you.",
    url: `${SITE_URL}/map`,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "HazardPin Hazard Map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hazard Map | HazardPin",
    description:
      "View all road hazards on an interactive map. Find potholes, debris, flooding, and other dangers near you.",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}