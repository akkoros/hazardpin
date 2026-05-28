'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

// ── Helpers ──────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  POTHOLE:        { emoji: '🕳️', color: 'text-red-700',  bg: 'bg-red-100 border-red-300' },
  DEBRIS:         { emoji: '🪵', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' },
  FLOODING:       { emoji: '🌊', color: 'text-blue-700',  bg: 'bg-blue-100 border-blue-300' },
  FALLEN_SIGNAGE: { emoji: '🪧', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
  ROAD_CRACK:     { emoji: '🧱', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  OTHER:          { emoji: '⚠️', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
}

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-600',   text: 'text-white' },
  HIGH:     { label: 'High',     bg: 'bg-orange-500', text: 'text-white' },
  MEDIUM:   { label: 'Medium',   bg: 'bg-yellow-400', text: 'text-yellow-900' },
  LOW:      { label: 'Low',      bg: 'bg-green-500',  text: 'text-white' },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  NEW:          { label: 'New',          bg: 'bg-slate-200',    text: 'text-slate-700' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-yellow-100',   text: 'text-yellow-800' },
  VERIFIED:     { label: 'Verified',     bg: 'bg-emerald-100',  text: 'text-emerald-800' },
  RESOLVED:     { label: 'Resolved',     bg: 'bg-blue-100',     text: 'text-blue-800' },
  ARCHIVED:     { label: 'Archived',     bg: 'bg-slate-100',    text: 'text-slate-500' },
  DISPUTED:     { label: 'Disputed',     bg: 'bg-red-100',      text: 'text-red-800' },
}

function relativeTime(createdAt: number): string {
  const seconds = Math.floor(Date.now() / 1000) - createdAt
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 2592000)}mo ago`
}

// ── Image with Flag Menu ──────────────────────────────────

function ImageCard({ img, reportId, flaggedImages, onFlagged }: {
  img: { id: string; url: string; r2Key?: string }
  reportId: string
  flaggedImages: string[]
  onFlagged: (imageKey: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [flagState, setFlagState] = useState<'idle' | 'menu' | 'submitting' | 'done' | 'error'>('idle')
  const [flagError, setFlagError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const imageKey = img.r2Key || img.id
  const isFlagged = flaggedImages.includes(imageKey)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function submitFlag(reason: string) {
    setFlagState('submitting')
    let userId = localStorage.getItem('hazardpin_user_id')
    if (!userId) {
      try {
        const res = await fetch('/api/auth/anonymous', { method: 'POST' })
        const data = await res.json()
        userId = data.userId
        if (userId) localStorage.setItem('hazardpin_user_id', userId)
      } catch {
        setFlagState('error')
        setFlagError('Failed to create anonymous user')
        return
      }
    }

    try {
      const res = await fetch(`/api/reports/${reportId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterId: userId, imageKey, reason }),
      })
      if (res.status === 409) {
        setFlagError('You have already reported this image')
        setFlagState('error')
        return
      }
      if (!res.ok) {
        setFlagError('Failed to submit report')
        setFlagState('error')
        return
      }
      setFlagState('done')
      setMenuOpen(false)
      onFlagged(imageKey)
    } catch {
      setFlagError('Network error')
      setFlagState('error')
    }
  }

  const flagOptions = [
    { reason: 'NOT_HAZARD',    label: 'Not a road hazard' },
    { reason: 'PERSONAL_INFO', label: 'Contains personal information' },
    { reason: 'ILLEGAL',       label: 'Illegal content' },
    { reason: 'SEXUAL',        label: 'Nudity / sexual content' },
    { reason: 'OTHER',         label: 'Other' },
  ]

  if (isFlagged) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-slate-200 aspect-square flex items-center justify-center border-2 border-slate-300">
        <div className="text-center p-2">
          <div className="text-2xl mb-1">🚫</div>
          <p className="text-xs text-slate-500 font-medium">Image under review</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group rounded-lg overflow-hidden aspect-square">
      <input
        type="checkbox"
        id={`zoom-${img.id}`}
        className="hidden peer"
      />
      <label htmlFor={`zoom-${img.id}`}>
        <img
          src={img.url}
          alt="Hazard report image"
          className="w-full h-full object-cover rounded-lg cursor-pointer hover:brightness-95 transition"
        />
      </label>
      {/* Zoom overlay */}
      <div className="fixed inset-0 z-50 bg-black/80 items-center justify-center hidden peer-checked:flex" onClick={(e) => { const cb = document.getElementById(`zoom-${img.id}`) as HTMLInputElement; if (cb) cb.checked = false; }}>
        <label htmlFor={`zoom-${img.id}`} className="max-h-[90vh] max-w-[90vw] cursor-zoom-out">
          <img src={img.url} alt="Zoomed" className="object-contain max-h-[90vh] max-w-[90vw] rounded" />
        </label>
      </div>

      {/* Flag button */}
      <button
        onClick={() => { setMenuOpen(true); setFlagState('idle'); setFlagError(''); }}
        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70"
        title="Report this image"
      >
        ⋮
      </button>

      {/* Flag dropdown */}
      {menuOpen && (
        <div ref={menuRef} className="absolute top-9 right-1 z-40 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-sm">
          {flagState === 'idle' || flagState === 'menu' ? (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Report this image</div>
              {flagOptions.map(opt => (
                <button
                  key={opt.reason}
                  onClick={() => submitFlag(opt.reason)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                >
                  {opt.label}
                </button>
              ))}
            </>
          ) : flagState === 'submitting' ? (
            <div className="px-3 py-3 text-slate-500 text-center">Submitting...</div>
          ) : flagState === 'done' ? (
            <div className="px-3 py-3 text-emerald-700 text-center font-medium">Thank you for reporting</div>
          ) : flagState === 'error' ? (
            <div className="px-3 py-3">
              <p className="text-red-600 text-center">{flagError}</p>
              <button onClick={() => setFlagState('idle')} className="mt-1 text-xs text-slate-500 underline mx-auto block">Try again</button>
            </div>
          ) : null}
          <button
            onClick={() => setMenuOpen(false)}
            className="w-full text-center px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 border-t border-slate-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ── Review Item ───────────────────────────────────────────

function ReviewItem({ rv }: { rv: any }) {
  const isUp = rv.vote === 'UP'
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {isUp ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0">
        {rv.comment ? <p className="text-sm text-slate-700">{rv.comment}</p> : <p className="text-sm text-slate-400 italic">No comment</p>}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{relativeTime(rv.createdAt)}</span>
          {rv.weight > 1 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">×{rv.weight.toFixed(1)}</span>}
        </div>
      </div>
    </div>
  )
}

// ── Verified Banner ────────────────────────────────────────

function VerificationBanner({ upCount, downCount }: { upCount: number; downCount: number }) {
  const total = upCount + downCount
  if (total === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
        <span className="text-base">ℹ️</span>
        No community votes yet — be the first to verify!
      </div>
    )
  }
  if (upCount >= 3 && upCount > downCount * 2) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm text-emerald-800 font-medium">
        <span className="text-base">✅</span>
        Verified by {upCount} community member{upCount !== 1 ? 's' : ''}
      </div>
    )
  }
  if (downCount >= 3 && downCount > upCount * 2) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-800 font-medium">
        <span className="text-base">⚠️</span>
        Disputed by {downCount} community member{downCount !== 1 ? 's' : ''}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-800">
      <span className="text-base">🔍</span>
      Under review — {upCount} upvote{upCount !== 1 ? 's' : ''}, {downCount} downvote{downCount !== 1 ? 's' : ''}
    </div>
  )
}

// ── Vote Section ───────────────────────────────────────────

function VoteSection({ reportId, onVoted }: { reportId: string; onVoted: () => void }) {
  const [vote, setVote] = useState<'UP' | 'DOWN' | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!vote) return
    setSubmitting(true)
    setError('')

    let userId = localStorage.getItem('hazardpin_user_id')
    if (!userId) {
      try {
        const res = await fetch('/api/auth/anonymous', { method: 'POST' })
        const data = await res.json()
        userId = data.userId
        if (userId) localStorage.setItem('hazardpin_user_id', userId)
      } catch {
        setError('Failed to create anonymous user')
        setSubmitting(false)
        return
      }
    }

    try {
      const res = await fetch(`/api/reports/${reportId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: userId, vote, comment }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Vote failed')
        setSubmitting(false)
        return
      }
      onVoted()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">Your verification</p>
      <div className="flex gap-2">
        <button
          onClick={() => setVote('UP')}
          className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition ${
            vote === 'UP'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
          }`}
        >
          ✓ Confirm this hazard
        </button>
        <button
          onClick={() => setVote('DOWN')}
          className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition ${
            vote === 'DOWN'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-red-300'
          }`}
        >
          ✗ Report as incorrect
        </button>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment (why do you confirm or dispute?)"
        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
        rows={2}
      />
      {vote && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50 transition ${
            vote === 'UP' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [flaggedImages, setFlaggedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/reports/${id}`).then(r => r.json()),
      fetch(`/api/reports/${id}/reviews`).then(r => r.json()),
    ]).then(([r, rv]) => {
      setReport(r)
      setReviews(rv.reviews || [])
      setFlaggedImages((r.flaggedImages || '').split(',').filter(Boolean))
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    </div>
  )

  if (!report) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500">Report not found</div>
      </div>
    </div>
  )

  const catConfig = CATEGORY_CONFIG[report.category] || CATEGORY_CONFIG.OTHER
  const sevConfig = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.LOW
  const statConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.NEW

  const upCount = reviews.filter(r => r.vote === 'UP').length
  const downCount = reviews.filter(r => r.vote === 'DOWN').length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4 pb-24">

        {/* ── Back link ── */}
        <a href="/" className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition">
          ← Back to feed
        </a>

        {/* ── Report Card (Reddit-style) ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Category + Severity row */}
          <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${catConfig.bg} ${catConfig.color}`}>
              {catConfig.emoji} {report.category.replace(/_/g, ' ')}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${sevConfig.bg} ${sevConfig.text}`}>
              {sevConfig.label}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${statConfig.bg} ${statConfig.text}`}>
              {statConfig.label}
            </span>
          </div>

          {/* Description */}
          <div className="px-4 pb-3">
            <p className="text-base text-slate-800 leading-relaxed">{report.description || 'No description provided'}</p>
          </div>

          {/* Meta row */}
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-slate-500">
            <span>Submitted by {report.displayName || 'Anonymous'}</span>
            <span>•</span>
            <span>{relativeTime(report.createdAt)}</span>
            {report.address && (
              <>
                <span>•</span>
                <span>📍 {report.address}</span>
              </>
            )}
          </div>

          {/* Vote counts (Reddit-style) */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-xs">
            <span className="text-emerald-600 font-medium">↑ {upCount}</span>
            <span className="text-red-500 font-medium">↓ {downCount}</span>
          </div>
        </div>

        {/* ── Images ── */}
        {report.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {report.images.map((img: any) => (
              <ImageCard
                key={img.id}
                img={img}
                reportId={id}
                flaggedImages={flaggedImages}
                onFlagged={(ik) => setFlaggedImages(prev => [...prev, ik])}
              />
            ))}
          </div>
        )}

        {/* ── Community Verification (Community Notes style) ── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Community Verification</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {reviews.length} vote{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Aggregated status */}
          <div className="px-4 pb-3">
            <VerificationBanner upCount={upCount} downCount={downCount} />
          </div>

          {/* Review list */}
          {reviews.length > 0 && (
            <div className="px-4 pb-3 max-h-48 overflow-y-auto">
              {reviews.map((rv: any) => (
                <ReviewItem key={rv.id || rv.createdAt} rv={rv} />
              ))}
            </div>
          )}

          {/* Your vote */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-100">
            <VoteSection reportId={id} onVoted={() => window.location.reload()} />
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}