import { ReviewAggregator } from './durable-objects/ReviewAggregator'
import { Leaderboard } from './durable-objects/Leaderboard'

export { ReviewAggregator, Leaderboard }

export default {
  async fetch(req: Request, env: any) {
    return new Response("DO Worker stub")
  }
}
