import type { Metadata } from "next";

const SITE_URL = "https://hazardpin.moikapy.workers.dev";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let report: any = null;
  try {
    // Fetch report data server-side for metadata
    // In Cloudflare Workers, we can use the internal API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `https://hazardpin.moikapy.workers.dev`;
    const res = await fetch(`${baseUrl}/api/reports/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      report = await res.json();
    }
  } catch {
    // Silently fail — metadata will fall back to defaults
  }

  if (!report) {
    return {
      title: "Hazard Report — HazardPin",
      description: "View this road hazard report on HazardPin.",
      openGraph: {
        title: "Hazard Report — HazardPin",
        description: "View this road hazard report on HazardPin.",
        url: `${SITE_URL}/reports/${id}`,
      },
    };
  }

  const category = (report.category || "HAZARD").replace(/_/g, " ");
  const severity = report.severity || "UNKNOWN";
  const description = report.description
    ? `${category} hazard (${severity}): ${report.description.slice(0, 150)}`
    : `${category} road hazard reported on HazardPin. Verify and help your community stay safe.`;
  const title = `${category} Hazard — ${severity} | HazardPin`;
  const reportUrl = `${SITE_URL}/reports/${id}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Report",
        item: reportUrl,
      },
    ],
  };

  return {
    title,
    description,
    alternates: {
      canonical: reportUrl,
    },
    openGraph: {
      title,
      description,
      url: reportUrl,
      type: "article",
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
    other: {
      "article:published_time": report.createdAt
        ? new Date(report.createdAt * 1000).toISOString()
        : undefined,
    },
  };
}

// Render JSON-LD in the head via a script tag
function BreadcrumbJsonLd({ id }: { id: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Hazard Report",
        item: `${SITE_URL}/reports/${id}`,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function ReportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // We use a wrapper to access params for JSON-LD — but since layout is static
  // we need to use a client-like approach. Actually in Next.js 15, layout params
  // are a Promise. Let's just render children and put JSON-LD in a Suspense boundary.
  return (
    <>
      <BreadcrumbJsonLdAsync id={params} />
      {children}
    </>
  );
}

// Async wrapper to resolve params promise
async function BreadcrumbJsonLdAsync({ id }: { id: Promise<{ id: string }> }) {
  const { id: reportId } = await id;
  return <BreadcrumbJsonLd id={reportId} />;
}