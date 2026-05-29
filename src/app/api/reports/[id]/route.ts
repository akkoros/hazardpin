import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

// export const runtime = 'edge' // enabled for Cloudflare deployment

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = await getCloudflareEnv()
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
  const env = await getCloudflareEnv()
  const body = await req.json() as any
  const { id } = await params
  const now = Math.floor(Date.now() / 1000)

  if (body.status) {
    await env.DB.prepare(
      `UPDATE hazard_reports SET status = ?, updatedAt = ? WHERE id = ?`
    ).bind(body.status, now, id).run()
  }

  if (body.imageKeys && body.imageKeys.length > 0) {
    const publicBase = env.R2_PUBLIC_URL || env.NEXT_PUBLIC_R2_PUBLIC_URL || ''
    for (let i = 0; i < body.imageKeys.length; i++) {
      const key = body.imageKeys[i]
      const imageUrl = publicBase ? `${publicBase.replace(/\/+$/, '')}/${key}` : key
      await env.DB.prepare(
        `INSERT INTO report_images (id, reportId, url, r2Key, orderIdx, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(nanoid(), id, imageUrl, key, i, now).run()
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = await getCloudflareEnv()
  const { id } = await params

  // Parse reporterId from URL param or JSON body
  const url = new URL(req.url)
  let reporterId = url.searchParams.get('reporterId')
  if (!reporterId) {
    try {
      const body = await req.json() as any
      reporterId = body.reporterId
    } catch { /* no body */ }
  }

  if (!reporterId) {
    return NextResponse.json({ error: 'Missing reporterId' }, { status: 400 })
  }

  // Verify the report belongs to this user
  const report = await env.DB.prepare(
    `SELECT reporterId FROM hazard_reports WHERE id = ?`
  ).bind(id).first()

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  if ((report as any).reporterId !== reporterId) {
    return NextResponse.json({ error: 'You can only delete your own reports' }, { status: 403 })
  }

  // Delete related records, then the report
  await env.DB.prepare(`DELETE FROM report_images WHERE reportId = ?`).bind(id).run()
  await env.DB.prepare(`DELETE FROM reviews WHERE reportId = ?`).bind(id).run()
  await env.DB.prepare(`DELETE FROM flags WHERE reportId = ?`).bind(id).run()
  await env.DB.prepare(`DELETE FROM hazard_reports WHERE id = ?`).bind(id).run()

  // Invalidate leaderboard cache
  await env.KV.delete('leaderboard:TOP_REPORTER:WEEK')
  await env.KV.delete('leaderboard:TOP_REPORTER:MONTH')
  await env.KV.delete('leaderboard:TOP_REPORTER:ALL')

  return NextResponse.json({ ok: true, deleted: id })
}
