import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

const SITE_URL = "https://hazardpin.moikapy.workers.dev"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for HazardPin. Learn how we handle your data, location information, and anonymous identity on our community road hazard reporter.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto px-6 py-10 pb-24">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: May 2026</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Information We Collect</h2>
          <p className="text-slate-600 leading-relaxed">
            HazardPin is designed to collect as little personal information as possible. When you use our service, we collect the following: <strong>Anonymous User ID</strong> — an auto-generated random identifier stored locally on your device. This ID is not linked to your name, email address, phone number, or any other personally identifiable information. <strong>Location Data</strong> — GPS coordinates are collected only when you actively choose to submit a hazard report or when you view the map. We do not track your location in the background or when the app is closed. <strong>Photos</strong> — images you choose to attach to hazard reports. All EXIF metadata (including GPS coordinates, camera model, and timestamps) is automatically stripped from photos before they are stored on our servers. <strong>Device Information</strong> — we collect basic browser and device data (such as browser type and operating system) through our hosting provider&apos;s standard server logs to ensure the service runs properly and to prevent abuse. <strong>Community Verification Data</strong> — upvotes and downvotes you cast on hazard reports are recorded to support the verification system.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">2. How We Use Your Information</h2>
          <p className="text-slate-600 leading-relaxed">
            We use the information we collect solely to operate and improve HazardPin. Specifically, we use your data to: (a) display hazard reports on the public map for the benefit of the community; (b) associate your verification votes with reports; (c) power the community leaderboard showing active reporters; (d) maintain the integrity and safety of the platform through content moderation; (e) improve the service, fix bugs, and enhance user safety; and (f) comply with legal obligations. We do not use your data for targeted advertising, profiling, or any purpose unrelated to the core functionality of the service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">3. Data Storage</h2>
          <p className="text-slate-600 leading-relaxed">
            HazardPin is hosted on Cloudflare infrastructure. Hazard reports and verification data are stored in Cloudflare D1 (a SQLite database). Uploaded photos are stored in Cloudflare R2 object storage. Anonymous user IDs are stored in your browser&apos;s localStorage — we do not use cookies for tracking. All data in transit is encrypted using HTTPS/TLS. Data at rest in Cloudflare D1 and R2 is encrypted using industry-standard encryption. Cloudflare data centers are located primarily in the United States, and your data may be processed and stored in the United States. By using HazardPin, you consent to the transfer of information to the United States and other countries where our infrastructure providers operate.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">4. Location Data</h2>
          <p className="text-slate-600 leading-relaxed">
            Location data is collected ONLY when you actively choose to submit a hazard report. We never access your GPS coordinates in the background, and location data is never collected while the app is idle or closed. When you submit a report, your GPS coordinates are stored as latitude and longitude values along with a geohash for map indexing. Location data is displayed publicly on the hazard map as part of your report. We do not share your location data with any third parties for advertising, marketing, or any purpose other than displaying your report on the map. You can opt out of GPS location sharing in your device settings — reports submitted without location data will not appear on the map.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">5. Photos</h2>
          <p className="text-slate-600 leading-relaxed">
            Photos you upload are a critical part of hazard reporting. Before any photo is stored on our servers, we automatically strip all EXIF metadata — this includes GPS coordinates, camera make and model, timestamps, and any other embedded metadata. Only the visual image content is retained. Photos are publicly visible to all HazardPin users on the map alongside the hazard report they are attached to. Any user can flag a photo that they believe contains illegal content, inappropriate material, personal information (such as identifiable faces or license plates), or content unrelated to road hazards. Flagged photos are reviewed and may be removed at our discretion. Please be mindful when capturing photos — avoid including faces, license plates, or private property that you do not have permission to share.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">6. Data Sharing</h2>
          <p className="text-slate-600 leading-relaxed">
            We do NOT sell, rent, trade, or otherwise share your personal data with third parties for commercial purposes. We share data only in the following limited circumstances: <strong>Cloudflare (Infrastructure Provider)</strong> — hazard reports, photos, and associated data are stored on Cloudflare&apos;s infrastructure (D1, KV, and R2) as necessary to operate the service. Cloudflare processes this data as our service provider and is bound by their own privacy policies. <strong>Law Enforcement</strong> — we may disclose information when required by law, such as in response to a valid subpoena, court order, or legal process. We may also disclose information when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request. <strong>Public Data</strong> — hazard reports, including descriptions, photos, and location coordinates, are publicly visible on the HazardPin map by design. This is a core feature of the service and is not considered &quot;sharing&quot; with third parties.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">7. Your Rights</h2>
          <p className="text-slate-600 leading-relaxed">
            We believe you should have control over your data. You have the following rights: <strong>Access</strong> — you can view all hazard reports associated with your anonymous ID by visiting the API endpoint at <code className="bg-slate-100 px-1 py-0.5 rounded text-sm">GET /api/reports?reporterId=&#123;yourId&#125;</code>. <strong>Data Export</strong> — you can export your report data in a structured format through the same API endpoint. <strong>Deletion</strong> — you may request deletion of your reports and associated data by contacting us at privacy@moikapy.dev (automated deletion is coming soon). <strong>Opt Out of GPS</strong> — you can disable GPS location access in your device&apos;s settings at any time. Reports submitted without location data will still be saved but will not appear on the map. <strong>Reset Identity</strong> — you can generate a new anonymous ID at any time from the Settings page, which disassociates you from your previous reports. If you are a resident of the European Union or California, you may have additional rights under the GDPR or CCPA, respectively. To exercise any of these rights, please contact us at privacy@moikapy.dev.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">8. Children&apos;s Privacy</h2>
          <p className="text-slate-600 leading-relaxed">
            HazardPin is not directed to children under the age of 13. We do not knowingly collect, use, or disclose personal information from children under 13 in violation of the Children&apos;s Online Privacy Protection Act (COPPA). If you are under 13, please do not use HazardPin or provide any information to us. If we learn that we have inadvertently collected personal information from a child under 13, we will take steps to delete that information as promptly as possible. Parents or guardians who believe their child has provided personal information to HazardPin should contact us immediately at privacy@moikapy.dev.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">9. Data Retention</h2>
          <p className="text-slate-600 leading-relaxed">
            We retain different types of data for different periods based on their purpose: <strong>Hazard Reports</strong> — reports are kept indefinitely. Road hazard data serves a public safety interest, and historical reports help community members identify recurring problem areas. If you request deletion of your reports, we will remove your association from them but may retain the report data (description, location, photo) for the public benefit. <strong>Anonymous User IDs</strong> — are retained for 365 days from the date of last activity, after which they are automatically purged. <strong>Flags and Moderation Records</strong> — content flags and moderation actions are retained for audit purposes and may be kept indefinitely. <strong>Server Logs</strong> — standard server access logs are retained for 30 days and then automatically deleted. You may request earlier deletion of your data by contacting privacy@moikapy.dev.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">10. Changes to This Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            We may update this Privacy Policy from time to time. When we make material changes, we will notify you through an in-app notice and update the &quot;Last Updated&quot; date at the top of this page. Changes become effective immediately upon posting. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information. Your continued use of HazardPin after any changes constitutes your acceptance of the revised Privacy Policy.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">11. Contact</h2>
          <p className="text-slate-600 leading-relaxed">
            For questions or concerns about this Privacy Policy or our data practices, please contact us at{' '}
            <a href="mailto:privacy@moikapy.dev" className="text-emerald-600 hover:underline">
              privacy@moikapy.dev
            </a>
            . You can also reach us through our{' '}
            <a href="https://github.com/akkoros/hazardpin" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
              GitHub repository
            </a>
            . OYKAPY is the data controller for HazardPin. For GDPR-related inquiries, you may also contact us at the email address above.
          </p>
        </section>

        <div className="flex gap-4 text-sm mt-8">
          <Link href="/about" className="text-emerald-600 hover:underline">About</Link>
          <Link href="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}