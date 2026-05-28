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
