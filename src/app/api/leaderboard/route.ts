import { NextResponse } from 'next/server'
import { getRequestContext } from '@/app/lib/cloudflare'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { env } = getRequestContext()
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'TOP_REPORTER'
  const period = url.searchParams.get('period') || 'WEEK'

  const cached = await env.KV.get(`leaderboard:${type}:${period}`)
  if (cached) return NextResponse.json(JSON.parse(cached))

  // fallback to D1
  const column = type === 'TOP_REPORTER' ? 'reporterScore' : 'reviewerScore'
  const { results } = await env.DB.prepare(
    `SELECT id, displayName, ${column} as score FROM users ORDER BY ${column} DESC LIMIT 50`
  ).all()
  return NextResponse.json({ type, period, users: results })
}
