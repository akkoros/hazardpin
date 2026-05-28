import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/app/lib/cloudflare'
import { nanoid } from 'nanoid'
import * as Geohash from 'latlon-geohash'

export const runtime = 'edge'

export async function GET(req: Request) {
  const env = getCloudflareEnv()
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
  const env = getCloudflareEnv()
  const body = await req.json()
  const { reporterId, category, severity, description, latitude, longitude, address, imageKeys } = body

  const reportId = nanoid()
  const geohash = Geohash.encode(latitude, longitude, 8)
  const now = Math.floor(Date.now() / 1000)

  await env.DB.prepare(
    `INSERT INTO hazard_reports (id, reporterId, category, severity, description, latitude, longitude, address, status, geohash, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?)`
  ).bind(reportId, reporterId, category, severity, description || '', latitude, longitude, address || '', geohash, now, now).run()

  if (imageKeys && imageKeys.length) {
    for (let i = 0; i < imageKeys.length; i++) {
      const key = imageKeys[i]
      await env.DB.prepare(
        `INSERT INTO report_images (id, reportId, url, r2Key, orderIdx, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(nanoid(), reportId, `https://images.pothole-patrol.app/${key}`, key, i, now).run()
    }
  }

  return NextResponse.json({ id: reportId }, { status: 201 })
}
