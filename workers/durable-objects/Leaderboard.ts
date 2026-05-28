// stub DO for wrangler deploy; real types via @cloudflare/workers-types in wrangler builds
interface D1Database {
  prepare(query: string): any;
}
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: any): Promise<void>;
}
interface DurableObjectState {
  storage: { put(key: string, value: any): Promise<void>; get<T>(key: string): Promise<T | undefined>; setAlarm(timestamp: number): Promise<void>; };
}

export interface Env {
  DB: D1Database
  KV: KVNamespace
}

export class Leaderboard {
  state: DurableObjectState
  env: Env

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
  }

  async alarm(): Promise<void> {
    for (const type of ['TOP_REPORTER', 'TOP_REVIEWER']) {
      for (const period of ['WEEK', 'MONTH', 'ALL_TIME']) {
        const column = type === 'TOP_REPORTER' ? 'reporterScore' : 'reviewerScore'
        const { results } = await this.env.DB.prepare(
          `SELECT id, displayName, ${column} as score, tier FROM users ORDER BY ${column} DESC LIMIT 50`
        ).all()
        const payload = {
          type,
          period,
          generatedAt: Math.floor(Date.now() / 1000),
          users: results.map((u: any, i: number) => ({ rank: i + 1, ...u })),
        }
        await this.env.KV.put(`leaderboard:${type}:${period}`, JSON.stringify(payload), { expirationTtl: 300 })
      }
    }
    await this.state.storage.setAlarm(Date.now() + 5 * 60 * 1000)
  }
}
