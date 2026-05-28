import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = await getCloudflareEnv()
  const { id } = await params
  const body = await req.json() as { reviewerId?: string; vote?: string; comment?: string }
  const { reviewerId, vote, comment } = body
  if (!reviewerId || !vote) {
    return NextResponse.json({ error: 'Missing reviewerId or vote' }, { status: 400 })
  }

  const now = Math.floor(Date.now() / 1000)

  // Fetch reviewer accuracy to compute weight
  const reviewer = await env.DB.prepare(
    'SELECT reviewerScore FROM users WHERE id = ?'
  ).bind(reviewerId).first() as { reviewerScore: number } | null
  const weight = reviewer?.reviewerScore ?? 1.0

  await env.DB.prepare(
    `INSERT INTO reviews (id, reportId, reviewerId, vote, comment, weight, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(reportId, reviewerId) DO UPDATE SET vote = excluded.vote, comment = excluded.comment, weight = excluded.weight, createdAt = excluded.createdAt`
  ).bind(nanoid(), id, reviewerId, vote, comment || '', weight, now).run()

  // Inline aggregation: count upvotes/downvotes and update report status
  try {
    const { results } = await env.DB.prepare(
      `SELECT vote, SUM(weight) as totalWeight FROM reviews WHERE reportId = ? GROUP BY vote`
    ).bind(id).all()

    let upWeight = 0, downWeight = 0
    for (const row of results as any[]) {
      if (row.vote === 'UP') upWeight = row.totalWeight
      else if (row.vote === 'DOWN') downWeight = row.totalWeight
    }

    // Auto-verify if enough weighted upvotes
    let newStatus: string | null = null
    if (upWeight >= 3 && upWeight > downWeight * 2) {
      newStatus = 'VERIFIED'
    } else if (downWeight >= 3 && downWeight > upWeight * 2) {
      newStatus = 'DISPUTED'
    }

    if (newStatus) {
      await env.DB.prepare(
        'UPDATE hazard_reports SET status = ?, updatedAt = ? WHERE id = ?'
      ).bind(newStatus, now, id).run()
    }

    return NextResponse.json({ ok: true, weight, upWeight, downWeight, status: newStatus })
  } catch (e: any) {
    console.error('[Reviews] Aggregation failed:', e)
    return NextResponse.json({ ok: true, weight, warning: 'Aggregation skipped' })
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = await getCloudflareEnv()
  const { id } = await params
  const { results } = await env.DB.prepare(
    `SELECT vote, comment, weight, createdAt FROM reviews WHERE reportId = ?`
  ).bind(id).all()
  // Anonymize — do not include reviewerId
  return NextResponse.json({ reviews: results })
}