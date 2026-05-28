import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

// export const runtime = 'edge' // enabled for Cloudflare deployment

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

  // Notify ReviewAggregator DO
  try {
    const idObj = env.REVIEW_AGGREGATOR.idFromName(id)
    const stub = env.REVIEW_AGGREGATOR.get(idObj)
    const doResp = await stub.fetch(new Request('http://do.internal/aggregate', {
      method: 'POST',
      body: JSON.stringify({ reportId: id, vote, weight }),
    }))
    const doResult = await doResp.json()

    return NextResponse.json({ ok: true, weight, ...doResult })
  } catch (e: any) {
    console.error('DO call failed:', e)
    return NextResponse.json({ ok: true, weight, warning: 'DO aggregation skipped' })
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
