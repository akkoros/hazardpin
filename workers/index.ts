/// <reference types="@cloudflare/workers-types" />
import { ReviewAggregator } from './durable-objects/ReviewAggregator'
import { Leaderboard } from './durable-objects/Leaderboard'

export { ReviewAggregator, Leaderboard }

export default {
  async fetch(req: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === "/__health") {
      return new Response(JSON.stringify({ status: "ok" }), { headers: { "content-type": "application/json" } })
    }
    if (url.pathname === "/__ping") {
      return new Response("pong", { headers: { "content-type": "text/plain" } })
    }
    return new Response(
      JSON.stringify({ error: "Not found", path: url.pathname }),
      { status: 404, headers: { "content-type": "application/json" } }
    )
  }
} satisfies ExportedHandler
