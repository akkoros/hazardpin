import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

// export const runtime = 'edge' // enabled for Cloudflare deployment

export async function POST() {
  const env = await getCloudflareEnv()
  const userId = nanoid()
  const nowSec = Math.floor(Date.now() / 1000)

  // Create anonymous user in D1 with ON CONFLICT DO NOTHING for safety
  await env.DB.prepare(
    `INSERT INTO users (id, email, displayName, tier, role, createdAt, updatedAt)
     VALUES (?, ?, 'Anonymous', 'COMMUNITY', 'USER', ?, ?)
     ON CONFLICT (id) DO NOTHING`
  ).bind(userId, `anon-${userId}@hazardpin.local`, nowSec, nowSec).run()

  // Store in KV with 365-day TTL so we can validate anonymous sessions
  await env.KV.put(`user:anon:${userId}`, JSON.stringify({ id: userId, createdAt: nowSec }), {
    expirationTtl: 365 * 24 * 60 * 60,
  })

  return NextResponse.json({ userId }, { status: 201 })
}