import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/app/lib/cloudflare'
export const runtime = 'edge'

export async function GET(req: Request) {
  const env = getCloudflareEnv()
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'TOP_REPORTER'
  const period = url.searchParams.get('period') || 'WEEK'
  const cached = await env.KV.get(`leaderboard:${type}:${period}`)
  if (!cached) {
    return NextResponse.json({ error: 'Leaderboard not computed yet' }, { status: 503 })
  }
  return NextResponse.json(JSON.parse(cached))
}

export async function POST(req: Request) {
  const env = getCloudflareEnv()
  const body = await req.json()
  // Optional admin guard later; for now allow force-refresh
  if (body && body.action === 'refresh') {
    try {
      const idObj = env.LEADERBOARD.idFromName('global')
      const stub = env.LEADERBOARD.get(idObj)
      await stub.fetch(new Request('http://do.internal/refresh', { method: 'POST' }))
      return NextResponse.json({ refreshed: true })
    } catch (e: any) {
      console.error('Leaderboard refresh error:', e)
      return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
