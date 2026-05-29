import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

const SITE_URL = "https://hazardpin.moikapy.workers.dev"

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about HazardPin — a community-powered road hazard reporter. Our mission is safer streets through crowdsourced hazard reporting and verification.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About HazardPin",
    description:
      "Learn about HazardPin — a community-powered road hazard reporter. Safer streets through crowdsourced hazard reporting.",
    url: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto px-6 py-10 pb-24">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">About HazardPin</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            HazardPin is a community-powered road hazard reporter. We believe safer streets start with everyone. 
            When you spot a pothole, debris, flooding, or any road danger, you can pin it on the map for your neighbors to see — 
            and together, we verify, prioritize, and push for fixes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">How It Works</h2>
          <ol className="list-decimal list-inside text-slate-600 space-y-2">
            <li><strong>Spot</strong> a road hazard in your neighborhood.</li>
            <li><strong>Pin</strong> it on the map with a photo and description.</li>
            <li><strong>Verify</strong> — your neighbors confirm or upvote the report.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Built By</h2>
          <p className="text-slate-600">
            HazardPin is built by{' '}
            <a href="https://moikas.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">
              OYKAPY
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Open Source</h2>
          <p className="text-slate-600">
            HazardPin is open source. Contribute, report issues, or fork it at{' '}
            <a href="https://github.com/akkoros/hazardpin" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">
              github.com/akkoros/hazardpin
            </a>
            .
          </p>
        </section>

        <div className="flex gap-4 text-sm">
          <Link href="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}