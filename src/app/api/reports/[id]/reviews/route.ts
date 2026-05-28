import { NextResponse } from 'next/server'
import { getRequestContext } from '@/app/lib/cloudflare'
import { nanoid } from 'nanoid'

export const runtime = 'edge'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { env } = getRequestContext()
  const body = await req.json()
  const { reviewerId, vote, comment, weight } = body
  const reportId = (await params).id

  await env.DB.prepare(
    `INSERT INTO reviews (id, reportId, reviewerId, vote, comment, weight, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
  ).bind(nanoid(), reportId, reviewerId, vote, comment || '', weight ?? 1.0).run()

  // Notify DO
  const id = env.REVIEW_AGGREGATOR.idFromName(reportId)
  const stub = env.REVIEW_AGGREGATOR.get(id)
  await stub.fetch(new Request('http://internal/update', {
    method: 'POST',
    body: JSON.stringify({ reportId, vote, weight: weight ?? 1.0 })
  }))

  return NextResponse.json({ ok: true })
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { env } = getRequestContext()
  const { results } = await env.DB.prepare(
    `SELECT id, vote, comment, weight, createdAt FROM reviews WHERE reportId = ? ORDER BY createdAt DESC`
  ).bind((await params).id).all()
  return NextResponse.json({ reviews: results })
}
