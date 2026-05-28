import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'

export async function GET(req: Request) {
  const env = await getCloudflareEnv()
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'TOP_REPORTER'
  const period = url.searchParams.get('period') || 'WEEK'

  // Try KV cache first
  const cached = await env.KV.get(`leaderboard:${type}:${period}`)
  if (cached) {
    return NextResponse.json(JSON.parse(cached))
  }

  // Fallback: compute from D1 directly
  try {
    const since = Math.floor(Date.now() / 1000) - (period === 'MONTH' ? 30 * 86400 : period === 'ALL' ? 365 * 86400 : 7 * 86400)
    const { results } = await env.DB.prepare(
      `SELECT u.id, u.displayName, u.tier,
              COUNT(r.id) as reportCount,
              COALESCE(SUM(CASE WHEN r.status IN ('VERIFIED', 'IN_PROGRESS') THEN 1 ELSE 0 END), 0) as verifiedCount
       FROM users u
       LEFT JOIN hazard_reports r ON r.reporterId = u.id AND r.createdAt >= ?
       WHERE u.id != 'demo-user'
       GROUP BY u.id
       ORDER BY reportCount DESC
       LIMIT 50`
    ).bind(since).all()

    const users = results.map((u: any) => ({
      id: u.id,
      displayName: u.displayName || 'Anonymous',
      score: (u.reportCount || 0) + (u.verifiedCount || 0) * 3,
      tier: u.tier || 'COMMUNITY',
    }))

    // Cache for 1 hour
    await env.KV.put(`leaderboard:${type}:${period}`, JSON.stringify({ users }), { expirationTtl: 3600 })

    return NextResponse.json({ users })
  } catch (e: any) {
    console.error('[Leaderboard] D1 fallback failed:', e)
    return NextResponse.json({ users: [] })
  }
}