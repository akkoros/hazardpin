# HazardPin

Community road hazard reporter — pin it, verify it, fix it. Built with Next.js 15 + Cloudflare Pages + Cloudflare Workers. Uses D1 for relational data, R2 for photo storage, KV for sessions/leaderboard cache, and Durable Objects for review aggregation and leaderboard recomputation.

## Setup

1. **Clone the repo.**
2. **Install dependencies:**  
   `npm install`
3. **Configure Wrangler:**  
   - Create a Cloudflare D1 database, KV namespace, and R2 bucket.  
   - Update `wrangler.toml` with the real IDs.
4. **Deploy D1 migrations:**  
   `npx wrangler d1 migrations apply hazardpin-db`
5. **Deploy Durable Objects + Workers:**  
   `npx wrangler deploy`
6. **Build locally:**  
   `npm run build`
7. **Deploy to Cloudflare Pages:**  
   `npm run pages:build && npm run pages:deploy`

## Environment variables

| Name | Description | Where |
|---|---|---|
| `NEXTAUTH_SECRET` | Auth secret | `wrangler secret put` |
| `NEXT_PUBLIC_APP_URL` | App domain | `wrangler.toml` vars |

## Project structure

| Path | Purpose |
|---|---|
| `src/app/api/reports` | Reports API (list, create) |
| `src/app/api/reports/[id]` | Report detail API |
| `src/app/api/reports/[id]/reviews` | Vote/review API |
| `src/app/api/upload/presign` | R2 presigned URL generation |
| `src/app/api/leaderboard` | Leaderboard list API |
| `workers/durable-objects/ReviewAggregator.ts` | Per-report vote tally + status update |
| `workers/durable-objects/Leaderboard.ts` | Recalculate leaderboard every 5 min |
| `db/migrations/0001_init.sql` | D1 schema migrations |

## Notes

- App uses raw SQL via D1 `prepare()/bind()/run()`.
- Photos are uploaded to R2 via presigned PUT URLs (placeholder implementation using aws4fetch).
- Review weight defaults to 1.0 until reviewer accuracy scoring is implemented.
- Tier progression: Community → Trusted (10 verified) → Verified (50 verified).

## Out of scope (future)

- Municipal API, push notifications, AI image validation, heatmap view, i18n, route planner.