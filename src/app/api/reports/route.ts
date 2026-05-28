import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'
import Geohash from 'latlon-geohash'

// export const runtime = 'edge' // enabled for Cloudflare deployment

export async function GET(req: Request) {
  const env = await getCloudflareEnv()
  const url = new URL(req.url)
  const swLat = parseFloat(url.searchParams.get('sw_lat') || '0')
  const neLat = parseFloat(url.searchParams.get('ne_lat') || '90')
  const swLng = parseFloat(url.searchParams.get('sw_lng') || '-180')
  const neLng = parseFloat(url.searchParams.get('ne_lng') || '180')
  const statusParam = url.searchParams.get('status') || 'NEW,UNDER_REVIEW,VERIFIED'
  const statuses = statusParam.split(',')

  const { results } = await env.DB.prepare(
    `SELECT r.*, u.displayName, u.tier
     FROM hazard_reports r
     JOIN users u ON r.reporterId = u.id
     WHERE r.latitude BETWEEN ? AND ?
       AND r.longitude BETWEEN ? AND ?
       AND r.status IN (${statuses.map(()=>'?').join(',')})
     ORDER BY r.createdAt DESC
     LIMIT 200`
  ).bind(swLat, neLat, swLng, neLng, ...statuses).all()

  return NextResponse.json({ reports: results })
}

export async function POST(req: Request) {
  const env = await getCloudflareEnv()
  const body = await req.json() as any
  const { reporterId: rawReporterId, category, severity, description, latitude, longitude, address, imageKeys } = body

  // Dedup + rate-limit
  const geohash = Geohash.encode(latitude, longitude, 8)
  let reporterId = rawReporterId as string | undefined
  if (!reporterId) {
    reporterId = nanoid()
    // Insert anonymous user placeholder so FK constraints are satisfied
    const nowSec = Math.floor(Date.now() / 1000)
    await env.DB.prepare(
      `INSERT INTO users (id, email, displayName, avatarUrl, tier, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'COMMUNITY', 'USER', ?, ?)
       ON CONFLICT (id) DO NOTHING`
    ).bind(reporterId, `anon-${reporterId}@local`, 'Anonymous', '', nowSec, nowSec).run()
  }

  const nowSec = Math.floor(Date.now() / 1000)
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // Dedup key per reporter in same geohash (24h)
  const dedupKey = `dedup:${geohash}:${reporterId}`
  const existingDedup = await env.KV.get(dedupKey)
  if (existingDedup) {
    return NextResponse.json({ error: 'Duplicate report in this area (24h)' }, { status: 429 })
  }

  // Rate limit: max 10 reports per day per reporter
  const rlKey = `rl:reports:${reporterId}:day:${yyyymmdd}`
  const currentCount = parseInt((await env.KV.get(rlKey)) || '0', 10)
  if (currentCount >= 10) {
    return NextResponse.json({ error: 'Daily report limit reached' }, { status: 429 })
  }

  const reportId = nanoid()
  const now = nowSec

  await env.DB.prepare(
    `INSERT INTO hazard_reports (id, reporterId, category, severity, description, latitude, longitude, address, status, geohash, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?)`
  ).bind(reportId, reporterId, category, severity, description || '', latitude, longitude, address || '', geohash, now, now).run()

  // Store dedup KV and increment rate limit
  await env.KV.put(dedupKey, reportId, { expirationTtl: 24 * 60 * 60 })
  await env.KV.put(rlKey, String(currentCount + 1), { expirationTtl: 24 * 60 * 60 })

  if (imageKeys && imageKeys.length) {
    const publicBase = env.R2_PUBLIC_URL || env.NEXT_PUBLIC_R2_PUBLIC_URL || ''
    for (let i = 0; i < imageKeys.length; i++) {
      const key = imageKeys[i]
      const imageUrl = publicBase ? `${publicBase.replace(/\/+$/, '')}/${key}` : key
      await env.DB.prepare(
        `INSERT INTO report_images (id, reportId, url, r2Key, orderIdx, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(nanoid(), reportId, imageUrl, key, i, now).run()
    }
  }

  return NextResponse.json({ id: reportId }, { status: 201 })
}
