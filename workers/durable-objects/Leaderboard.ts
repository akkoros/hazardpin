/// <reference types="@cloudflare/workers-types" />
export interface Env {
  DB: D1Database
  KV: KVNamespace
}

interface LeaderboardPayload {
  type: string
  period: string
  generatedAt: number
  users: { rank: number; id: string; displayName: string | null; score: number; tier: string }[]
}

export class Leaderboard {
  constructor(
    private state: DurableObjectState,
    private env: Env
  ) {}

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    if (req.method === "POST" && url.pathname === "/refresh") {
      await this.computeAndStore()
      return new Response(JSON.stringify({ refreshed: true }))
    }
    return new Response(JSON.stringify({ hello: "leaderboard" }))
  }

  async alarm(): Promise<void> {
    try {
      await this.computeAndStore()
    } catch (e) {
      console.error("Leaderboard alarm error:", e)
    } finally {
      await this.state.storage.setAlarm(Date.now() + 5 * 60 * 1000)
    }
  }

  private async computeAndStore() {
    for (const type of ['TOP_REPORTER', 'TOP_REVIEWER']) {
      for (const period of ['WEEK', 'MONTH', 'ALL_TIME']) {
        const column = type === 'TOP_REPORTER' ? 'reporterScore' : 'reviewerScore'
        const { results } = await this.env.DB.prepare(
          `SELECT id, displayName, ${column} as score, tier FROM users ORDER BY ${column} DESC LIMIT 50`
        ).all()

        const payload: LeaderboardPayload = {
          type,
          period,
          generatedAt: Math.floor(Date.now() / 1000),
          users: (results ?? []).map((u: any, i: number) => ({
            rank: i + 1,
            id: u.id,
            displayName: u.displayName,
            score: u.score,
            tier: u.tier,
          })),
        }
        await this.env.KV.put(`leaderboard:${type}:${period}`, JSON.stringify(payload), { expirationTtl: 300 })
      }
    }
  }
}
