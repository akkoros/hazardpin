'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

interface Report {
  id: string
  category: string
  severity: string
  description: string
  latitude: number
  longitude: number
  status: string
  displayName: string
  tier: string
  createdAt: number
  upVotes: number
  downVotes: number
}

const CATEGORY_EMOJI: Record<string, string> = {
  POTHOLE: '🕳️',
  DEBRIS: '🚧',
  FLOODING: '🌊',
  SIGNAGE: '🪧',
  CRACK: '💔',
  OTHER: '❓',
}

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-yellow-400 text-slate-900',
  LOW: 'bg-emerald-500 text-white',
}

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-slate-200 text-slate-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  DISPUTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  FIXED: 'bg-emerald-200 text-emerald-800',
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports?sw_lat=-90&ne_lat=90&sw_lng=-180&ne_lng=180')
      .then(r => r.json())
      .then(data => {
        setReports(data.reports || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const topReporters = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.displayName] = (acc[r.displayName] || 0) + 1
    return acc
  }, {})
  const topNames = Object.entries(topReporters)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const verifiedCount = reports.filter(r => r.status === 'VERIFIED').length

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Pin it. Verify it. Fix it.
          </h1>
          <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
            Community-powered road hazard reporting. Spot dangers, pin them on the map, and let your neighbors verify.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/submit" className="bg-white text-emerald-700 font-bold px-6 py-2.5 rounded-lg hover:bg-emerald-50 transition-colors">
              + Report a Hazard
            </a>
            <a href="/map" className="border-2 border-white text-white font-bold px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
              🗺️ View Map
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {reports.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-6 py-3 flex gap-6 text-sm">
            <div><span className="font-bold text-slate-800">{reports.length}</span> <span className="text-slate-500">reports</span></div>
            <div><span className="font-bold text-emerald-600">{verifiedCount}</span> <span className="text-slate-500">verified</span></div>
            <div><span className="font-bold text-slate-800">{topNames.length}</span> <span className="text-slate-500">contributors</span></div>
          </div>
        </div>
      )}

      {/* Feed */}
      <section className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Recent Reports</h2>
          <a href="/map" className="text-sm text-emerald-600 font-medium hover:underline">View on map →</a>
        </div>

        {loading && (
          <div className="text-center py-12 text-slate-400">Loading reports...</div>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No hazard reports yet.</p>
            <a href="/submit" className="text-emerald-600 font-medium hover:underline">Be the first to report →</a>
          </div>
        )}

        <div className="space-y-3">
          {reports.map(r => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="block bg-white rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all p-4"
            >
              <div className="flex items-start gap-3">
                {/* Vote column */}
                <div className="flex flex-col items-center gap-0.5 text-xs text-slate-500 pt-0.5 min-w-[36px]">
                  <span className="text-emerald-600 font-bold text-sm">▲ {r.upVotes || 0}</span>
                  <span className="text-red-400 font-bold text-sm">▼ {r.downVotes || 0}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg leading-none">{CATEGORY_EMOJI[r.category] || '❓'}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[r.severity] || 'bg-slate-200 text-slate-700'}`}>
                      {r.severity}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-600'}`}>
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-sm text-slate-800 mt-1 line-clamp-2">{r.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                    <span>{r.displayName || 'Anonymous'}</span>
                    <span>·</span>
                    <span>{timeAgo(r.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {reports.length > 0 && (
          <div className="text-center mt-6">
            <a href="/map" className="text-sm text-emerald-600 font-medium hover:underline">
              See all reports on the map →
            </a>
          </div>
        )}
      </section>

      {/* How it works - brief */}
      <section className="bg-white border-t">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-8">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3 text-center">
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">👀</div>
              <h3 className="font-semibold text-slate-800 text-sm">1. Spot a hazard</h3>
              <p className="text-xs text-slate-500 mt-1">Pothole, debris, flooding — report what you see.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">📍</div>
              <h3 className="font-semibold text-slate-800 text-sm">2. Pin it on the map</h3>
              <p className="text-xs text-slate-500 mt-1">Add location, photos, and severity details.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">✅</div>
              <h3 className="font-semibold text-slate-800 text-sm">3. Community verifies</h3>
              <p className="text-xs text-slate-500 mt-1">Neighbors confirm reports. Verified hazards get priority.</p>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  )
}