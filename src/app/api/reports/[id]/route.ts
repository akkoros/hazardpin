import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/app/lib/cloudflare'

export const runtime = 'edge'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = getCloudflareEnv()
  const { id } = await params
  const report = await env.DB.prepare(
    `SELECT r.*, u.displayName, u.tier FROM hazard_reports r
     JOIN users u ON r.reporterId = u.id WHERE r.id = ?`
  ).bind(id).first()
  if (!report) return new Response('Not found', { status: 404 })

  const images = await env.DB.prepare(
    `SELECT * FROM report_images WHERE reportId = ? ORDER BY orderIdx`
  ).bind(id).all()
  return NextResponse.json({ ...report, images: images.results })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = getCloudflareEnv()
  const body = await req.json()
  if (!body.status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
  const { id } = await params
  await env.DB.prepare(
    `UPDATE hazard_reports SET status = ?, updatedAt = ? WHERE id = ?`
  ).bind(body.status, Math.floor(Date.now() / 1000), id).run()
  return NextResponse.json({ ok: true })
}
