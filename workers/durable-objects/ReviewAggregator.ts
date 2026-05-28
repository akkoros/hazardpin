export interface Env {
  DB: D1Database
}

interface ReportScore {
  up: number
  down: number
  weightedSum: number
  totalWeight: number
}

export class ReviewAggregator {
  state: DurableObjectState
  env: Env

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
  }

  async fetch(req: Request): Promise<Response> {
    const { reportId, vote, weight } = await req.json()
    let current = await this.state.storage.get<ReportScore>('score')
    if (!current) current = { up: 0, down: 0, weightedSum: 0, totalWeight: 0 }

    if (vote === 'UP') current.up++
    else current.down++
    current.weightedSum += (vote === 'UP' ? 1 : -1) * weight
    current.totalWeight += weight
    const score = current.totalWeight ? current.weightedSum / current.totalWeight : 0

    await this.state.storage.put('score', current)

    if (current.up + current.down >= 3 && score >= 0.6) {
      await this.env.DB.prepare(
        'UPDATE hazard_reports SET status = ?, verificationScore = ?, updatedAt = unixepoch() WHERE id = ?'
      ).bind('VERIFIED', score, reportId).run()
      // tier progression
      const row = await this.env.DB.prepare(
        'SELECT reporterId FROM hazard_reports WHERE id = ?'
      ).bind(reportId).first<{ reporterId: string }>()
      if (row) await this.promoteTier(row.reporterId)
    }

    return new Response(JSON.stringify({ score, status: score >= 0.6 ? 'VERIFIED' : 'UNDER_REVIEW' }))
  }

  async promoteTier(userId: string) {
    const row = await this.env.DB.prepare(
      'SELECT reportsVerified FROM users WHERE id = ?'
    ).bind(userId).first<{ reportsVerified: number }>()
    if (!row) return
    const verified = row.reportsVerified + 1
    let tier = 'COMMUNITY'
    if (verified >= 50) tier = 'VERIFIED'
    else if (verified >= 10) tier = 'TRUSTED'
    await this.env.DB.prepare(
      'UPDATE users SET reportsVerified = ?, tier = ?, updatedAt = unixepoch() WHERE id = ?'
    ).bind(verified, tier, userId).run()
  }
}
