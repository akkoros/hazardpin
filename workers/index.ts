/// <reference types="@cloudflare/workers-types" />
import { ReviewAggregator } from './durable-objects/ReviewAggregator'
import { Leaderboard } from './durable-objects/Leaderboard'

export { ReviewAggregator, Leaderboard }

interface WorkerEnv {
  DB: D1Database
  KV: KVNamespace
  REVIEW_AGGREGATOR: DurableObjectNamespace
  LEADERBOARD: DurableObjectNamespace
}

export default {
  async fetch(req: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === "/__health") {
      return new Response(JSON.stringify({ status: "ok" }), { headers: { "content-type": "application/json" } })
    }
    if (url.pathname === "/__ping") {
      return new Response("pong", { headers: { "content-type": "text/plain" } })
    }
    if (url.pathname === "/init" && url.searchParams.get('do') === 'leaderboard') {
      try {
        const idObj = env.LEADERBOARD.idFromName('global')
        const stub = env.LEADERBOARD.get(idObj)
        const resp = await stub.fetch(new Request('http://do.internal/init', { method: 'GET' }))
        return new Response(JSON.stringify({ do: 'leaderboard', init: resp.status === 200 }), { headers: { "content-type": "application/json" } })
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "content-type": "application/json" } })
      }
    }
    return new Response(
      JSON.stringify({ error: "Not found", path: url.pathname }),
      { status: 404, headers: { "content-type": "application/json" } }
    )
  }
} satisfies ExportedHandler<WorkerEnv>
