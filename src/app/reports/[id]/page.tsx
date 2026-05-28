'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/reports/${id}`).then(r => r.json() as any).then(setReport)
    fetch(`/api/reports/${id}/reviews`).then(r => r.json() as any).then((d: any) => setReviews(d.reviews || []))
  }, [id])

  if (!report) return <div className="p-4">Loading...</div>

  return (
    <main className="max-w-md mx-auto p-4 space-y-4">
      <a href="/" className="text-emerald-600 text-sm">&larr; Back to map</a>
      <h1 className="text-xl font-bold">{report.category} — {report.severity}</h1>
      <p className="text-sm text-slate-600">{report.description}</p>
      <div className="text-sm">Status: <span className="font-semibold">{report.status}</span></div>
      <div className="text-sm">Reporter: {report.displayName} ({report.tier})</div>
      {report.images?.length ? (
        <div className="grid grid-cols-2 gap-2">
          {report.images.map((img: any) => (
            <img key={img.id} src={img.url} alt="report" className="rounded" />
          ))}
        </div>
      ) : null}

      <hr />
      <h2 className="font-bold">Reviews</h2>
      {reviews.map((rv) => (
        <div key={rv.id} className="border rounded p-2 text-sm">
          <div className="flex justify-between"><span>{rv.vote}</span><span className="text-slate-500">{new Date(rv.createdAt * 1000).toLocaleString()}</span></div>
          {rv.comment ? <p className="mt-1">{rv.comment}</p> : null}
        </div>
      ))}
      <ReviewForm reportId={id} />
    </main>
  )
}

function ReviewForm({ reportId }: { reportId: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const fd = new FormData(e.currentTarget)

    // Get or create anonymous user ID
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
        body: JSON.stringify({
          reviewerId: userId,
          vote: fd.get('vote'),
          comment: fd.get('comment') || '',
          weight: 1.0,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Vote failed')
        setSubmitting(false)
        return
      }
      window.location.reload()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <select name="vote" className="border rounded p-2">
          <option value="UP">Upvote</option>
          <option value="DOWN">Downvote</option>
        </select>
        <input name="comment" placeholder="Comment (optional)" className="border rounded p-2 flex-1" />
        <button disabled={submitting} className="bg-emerald-600 text-white rounded px-3 py-2 disabled:opacity-50">
          {submitting ? '...' : 'Vote'}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  )
}