import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

type FlagReason = 'NOT_HAZARD' | 'PERSONAL_INFO' | 'ILLEGAL' | 'SEXUAL' | 'OTHER'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = await getCloudflareEnv()
  const { id } = await params

  let body: { reporterId?: string; imageKey?: string; reason?: string; comment?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { reporterId, imageKey, reason, comment } = body
  if (!reporterId || !reason) {
    return NextResponse.json({ error: 'Missing reporterId or reason' }, { status: 400 })
  }

  const validReasons: FlagReason[] = ['NOT_HAZARD', 'PERSONAL_INFO', 'ILLEGAL', 'SEXUAL', 'OTHER']
  if (!validReasons.includes(reason as FlagReason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }

  // Dedup check: KV key with 24h TTL
  const kvKey = `flag:${id}:${imageKey || 'report'}:${reporterId}`
  const existing = await env.KV.get(kvKey)
  if (existing) {
    return NextResponse.json({ error: 'Already reported' }, { status: 409 })
  }

  const now = Math.floor(Date.now() / 1000)
  const flagId = nanoid()

  // Store dedup marker in KV (24h TTL)
  await env.KV.put(kvKey, '1', { expirationTtl: 86400 })

  // Insert flag record into D1
  await env.DB.prepare(
    `INSERT INTO flags (id, reportId, reporterId, imageKey, reason, comment, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(flagId, id, reporterId, imageKey || null, reason, comment || '', now).run()

  // If an image was flagged, update the report's flaggedImages set
  if (imageKey) {
    // Fetch current flagged images
    const report = await env.DB.prepare(
      'SELECT flaggedImages FROM hazard_reports WHERE id = ?'
    ).bind(id).first() as { flaggedImages: string | null } | null

    const flaggedSet = new Set<string>(
      report?.flaggedImages ? (report.flaggedImages as string).split(',').filter(Boolean) : []
    )
    flaggedSet.add(imageKey)
    await env.DB.prepare(
      'UPDATE hazard_reports SET flaggedImages = ?, updatedAt = ? WHERE id = ?'
    ).bind([...flaggedSet].join(','), now, id).run()
  }

  return NextResponse.json({ ok: true, flagId })
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const env = await getCloudflareEnv()
  const { id } = await params

  const { results } = await env.DB.prepare(
    'SELECT id, imageKey, reason, comment, createdAt FROM flags WHERE reportId = ?'
  ).bind(id).all()

  return NextResponse.json({ flags: results })
}