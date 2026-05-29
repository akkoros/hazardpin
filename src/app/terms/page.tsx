import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

const SITE_URL = "https://hazardpin.moikapy.workers.dev"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for HazardPin — community road hazard reporter. Read about your rights, responsibilities, and our content policies.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto px-6 py-10 pb-24">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: May 2026</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            By accessing or using HazardPin (available at hazardpin.moikapy.workers.dev), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms, you may not access or use the service. These Terms constitute a legally binding agreement between you and OYKAPY (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We reserve the right to modify these Terms at any time as described in Section 11. Your continued use of HazardPin following any changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">2. Use License</h2>
          <p className="text-slate-600 leading-relaxed">
            Subject to your compliance with these Terms, we grant you a limited, non-exclusive, revocable, non-transferable, non-sublicensable license to access and use HazardPin for your personal, non-commercial purposes. This license does not include the right to: (a) modify, adapt, hack, or reverse-engineer any part of the service; (b) use any data mining, robots, scraping, or similar data-gathering methods on the service; (c) download or copy any portion of the service except as expressly permitted by us; (d) use the service for any commercial purpose without our written consent; or (e) access the service through any automated means including scripts or bots. Any use of the service not expressly permitted by these Terms is a breach of these Terms and may violate copyright, trademark, and other laws.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">3. User Accounts</h2>
          <p className="text-slate-600 leading-relaxed">
            HazardPin uses anonymous identification. When you first use the service, an anonymous user ID is automatically generated and stored locally on your device. This ID is not linked to your name, email address, or other personally identifiable information. You are responsible for safeguarding access to your device and your anonymous ID. You agree to accept responsibility for all activities that occur under your anonymous ID. You may reset your anonymous ID at any time from the Settings page, which will create a new identity and disassociate you from prior reports. We do not offer account recovery — if you lose access to your device or clear your local storage, you will receive a new anonymous ID.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">4. Prohibited Uses</h2>
          <p className="text-slate-600 leading-relaxed">
            You may not use HazardPin to: (a) submit false, misleading, or fraudulent hazard reports; (b) upload content that violates any applicable local, state, national, or international law or regulation; (c) upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable; (d) upload, post, or transmit any sexually explicit content, child sexual abuse material (CSAM), or any imagery depicting illegal activity; (e) impersonate any person or entity, or falsely state or misrepresent your affiliation with any person or entity; (f) stalk, harass, or harm another person; (g) use automated scripts, bots, or other automated means to interact with the service or submit reports; (h) attempt to gain unauthorized access to any part of the service, other accounts, or computer systems; (i) interfere with or disrupt the integrity or performance of the service; (j) use the service to distribute spam or unsolicited commercial content; or (k) upload content that contains personal information of others (such as license plate numbers, home addresses, or faces) without their consent. We reserve the right to remove any content that violates these prohibitions and to restrict or terminate access for any user who violates these Terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">5. Hazard Reporting Disclaimer</h2>
          <p className="text-slate-600 leading-relaxed">
            HazardPin is a community-powered platform for reporting road hazards. All hazard reports are submitted by users and represent their personal observations and opinions. Reports on HazardPin do NOT constitute professional safety assessments, official government records, or verified facts. We make no guarantees about the accuracy, timeliness, completeness, or reliability of any hazard report. Road conditions change constantly, and a reported hazard may no longer exist or may be more severe than described. HazardPin is NOT a substitute for calling emergency services (911) or reporting hazards directly to the appropriate government authority. Always exercise caution and proper judgment when navigating roads. Never rely solely on HazardPin to determine road safety. We expressly disclaim any responsibility for decisions you make based on information viewed on HazardPin.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">6. User-Generated Content</h2>
          <p className="text-slate-600 leading-relaxed">
            You retain ownership of all content you submit to HazardPin, including hazard reports, descriptions, photos, and verification votes. By submitting content, you grant us a worldwide, non-exclusive, royalty-free, perpetual, irrevocable license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content within the service and for promotional purposes related to the service. You represent and warrant that you own or control all rights to the content you submit and that the content does not violate the rights of any third party. As a platform hosting user-generated content, HazardPin is protected under Section 230 of the Communications Decency Act (47 U.S.C. &sect; 230), which provides that we are not treated as the publisher or speaker of content provided by our users. Accordingly, we are not liable for the substance, accuracy, or legality of any user-submitted report, photo, or comment. We reserve the right, but have no obligation, to monitor, edit, or remove any content at our sole discretion.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">7. DMCA / Copyright</h2>
          <p className="text-slate-600 leading-relaxed">
            We respect the intellectual property rights of others and expect our users to do the same. In accordance with the Digital Millennium Copyright Act (17 U.S.C. &sect; 512) and other applicable laws, we will respond to valid DMCA takedown notices. If you believe that content on HazardPin infringes your copyright, you may submit a DMCA takedown notice to our designated copyright agent at: legal@moikapy.dev. Your notice must include: (a) a physical or electronic signature of the copyright owner or authorized agent; (b) identification of the copyrighted work you claim has been infringed; (c) identification of the infringing material on HazardPin and its location (including URL); (d) your contact information including address, phone number, and email; (e) a statement that you have a good faith belief that the use is not authorized by the copyright owner; and (f) a statement, under penalty of perjury, that the information is accurate and that you are authorized to act on behalf of the copyright owner. If you believe your content was removed in error, you may submit a counter-notification to the same address with: (a) your signature; (b) identification of the removed content and its location; (c) a statement under penalty of perjury that you have a good faith belief the content was removed by mistake; (d) your name, address, and consent to jurisdiction; and (e) a statement consenting to service of process. We will comply with the DMCA&apos;s timelines for reinstating content following a valid counter-notification.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">8. Content Moderation</h2>
          <p className="text-slate-600 leading-relaxed">
            HazardPin allows community members to verify hazard reports through upvotes and downvotes. Users may also flag photos or reports that they believe contain illegal content, personal information, inappropriate imagery, or content unrelated to road hazards. We reserve the right to remove any content at our discretion, including but not limited to: content flagged for depicting illegal activity, child sexual abuse material, or content that violates these Terms; images that contain personal information (such as faces or license plates); content that is not related to road hazards; content that is false, misleading, or spam; and content that violates any applicable law. We may also restrict or terminate the access of any user who repeatedly violates these Terms. Content moderation decisions are made at our sole discretion, and we are not obligated to provide reasons for any removal. Reports of illegal content will be handled promptly and may be reported to law enforcement where required by law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">9. Limitation of Liability</h2>
          <p className="text-slate-600 leading-relaxed">
            HAZARDPIN IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTY OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. IN NO EVENT SHALL OYKAPY, ITS OPERATORS, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (a) YOUR ACCESS TO OR USE OF, OR INABILITY TO ACCESS OR USE, THE SERVICE; (b) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (c) ANY CONTENT OBTAINED FROM THE SERVICE; OR (d) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT. IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED ONE HUNDRED U.S. DOLLARS ($100) OR THE AMOUNT YOU PAID TO USE THE SERVICE (WHICHER IS GREATER). SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES OR LIMITATION OF LIABILITY, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">10. Indemnification</h2>
          <p className="text-slate-600 leading-relaxed">
            You agree to indemnify, defend, and hold harmless OYKAPY and its officers, directors, employees, agents, and affiliates from and against any and all claims, demands, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or in connection with: (a) your access to or use of HazardPin; (b) any content you submit, post, or transmit through the service; (c) your violation of these Terms; or (d) your violation of any rights of another person or entity. This indemnification obligation will survive the termination of your use of the service and these Terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">11. Changes to Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            We reserve the right to revise and update these Terms at any time at our sole discretion. When we make material changes, we will provide notice through in-app notification and update the &quot;Last Updated&quot; date at the top of this page. Changes become effective immediately upon posting. Your continued use of HazardPin after the effective date of any revised Terms constitutes your acceptance of those changes. We encourage you to review these Terms periodically to stay informed of any updates. It is your responsibility to check these Terms regularly.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">12. Contact</h2>
          <p className="text-slate-600 leading-relaxed">
            For questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:legal@moikapy.dev" className="text-emerald-600 hover:underline">
              legal@moikapy.dev
            </a>
            . You can also reach us through our{' '}
            <a href="https://github.com/akkoros/hazardpin" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
              GitHub repository
            </a>
            .
          </p>
        </section>

        <div className="flex gap-4 text-sm mt-8">
          <Link href="/about" className="text-emerald-600 hover:underline">About</Link>
          <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}