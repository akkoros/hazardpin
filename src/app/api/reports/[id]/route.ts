import { NextResponse } from 'next/server'
import { getRequestContext } from '@/app/lib/cloudflare'

export const runtime = 'edge'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { env } = getRequestContext()
  const report = await env.DB.prepare(
    `SELECT r.*, u.displayName, u.tier FROM hazard_reports r
     JOIN users u ON r.reporterId = u.id WHERE r.id = ?`
  ).bind((await params).id).first()
  if (!report) return new Response('Not found', { status: 404 })

  const images = await env.DB.prepare(
    `SELECT * FROM report_images WHERE reportId = ? ORDER BY orderIdx`
  ).bind(report.id).all()
  return NextResponse.json({ ...report, images: images.results })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { env } = getRequestContext()
  const body = await req.json()
  if (!body.status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
  await env.DB.prepare(
    `UPDATE hazard_reports SET status = ?, updatedAt = unixepoch() WHERE id = ?`
  ).bind(body.status, (await params).id).run()
  return NextResponse.json({ ok: true })
}
