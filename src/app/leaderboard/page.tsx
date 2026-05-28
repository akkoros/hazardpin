'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

const TIER_CONFIG: Record<string, { label: string; emoji: string; gradient: string; ring: string; badge: string }> = {
  FOUNDER:    { label: 'Founder',    emoji: '👑', gradient: 'from-amber-400 to-amber-600', ring: 'ring-amber-400', badge: 'bg-amber-100 text-amber-800' },
  MAINTAINER: { label: 'Maintainer', emoji: '🛡️', gradient: 'from-purple-400 to-purple-600', ring: 'ring-purple-400', badge: 'bg-purple-100 text-purple-800' },
  TRUSTED:    { label: 'Trusted',    emoji: '⭐', gradient: 'from-blue-400 to-blue-600', ring: 'ring-blue-400', badge: 'bg-blue-100 text-blue-800' },
  COMMUNITY:  { label: 'Community',  emoji: '🌱', gradient: 'from-slate-300 to-slate-500', ring: 'ring-slate-300', badge: 'bg-slate-100 text-slate-700' },
}

const PERIOD_CONFIG = [
  { value: 'WEEK', label: 'This Week' },
  { value: 'MONTH', label: 'This Month' },
  { value: 'ALL', label: 'All Time' },
]

export default function LeaderboardPage() {
  const [data, setData] = useState<any>({ users: [] })
  const [period, setPeriod] = useState('WEEK')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?type=TOP_REPORTER&period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const sorted = [...(data.users || [])].sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-800">Leaderboard</h1>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{PERIOD_CONFIG.find(p => p.value === period)?.label}</span>
        </div>

        {/* Period tabs — macOS segmented control style */}
        <div className="flex bg-slate-200/70 rounded-xl p-1 mb-5 backdrop-blur-sm">
          {PERIOD_CONFIG.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                period === p.value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sorted.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No reporters yet</h3>
            <p className="text-sm text-slate-500 mb-4">Be the first to report a hazard and claim the top spot!</p>
            <a
              href="/submit"
              className="inline-block bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Report a Hazard
            </a>
          </div>
        )}

        {/* Leaderboard cards */}
        {!loading && sorted.length > 0 && (
          <div className="space-y-3">
            {sorted.map((u: any, i: number) => {
              const tier = TIER_CONFIG[u.tier] || TIER_CONFIG.COMMUNITY
              const isTop3 = i < 3
              const medals = ['🥇', '🥈', '🥉']
              const rankGradient = ['from-amber-50 to-amber-100 border-amber-200', 'from-slate-50 to-slate-100 border-slate-200', 'from-orange-50 to-orange-100 border-orange-200']
              return (
                <div
                  key={u.id}
                  className={`relative bg-gradient-to-br rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${
                    isTop3 ? rankGradient[i] : 'from-white to-slate-50 border-slate-100'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                      {isTop3 ? medals[i] : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{u.displayName}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tier.badge}`}>
                          {tier.emoji} {tier.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>{u.reportCount || 0} report{(u.reportCount || 0) !== 1 ? 's' : ''}</span>
                        <span>{u.verifiedCount || 0} verified</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-slate-800">{u.score}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">pts</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        {!loading && sorted.length > 0 && (
          <p className="text-center text-xs text-slate-400 mt-6">
            Score = reports + (verified reports × 3)
          </p>
        )}
      </main>

      <BottomNav />
    </div>
  )
}