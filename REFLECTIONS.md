# Building HazardPin: Session Reflection Notes

**Date:** 2026-05-28 → 2026-05-29
**Project:** HazardPin — Community Road Hazard Reporter
**Stack:** Next.js 15.5.18, @opennextjs/cloudflare, Cloudflare D1/KV/R2, Tailwind CSS 4
**Url:** https://hazardpin.moikapy.workers.dev
**Repo:** github.com/akkoros/hazardpin

---

## What We Built

A community-driven road hazard reporting app. Users pin hazards (potholes, flooding, debris) on a map, upload photos with GPS, and other users verify or dispute them. Built and deployed end-to-end in a single session on a Raspberry Pi 5.

### Feature Set (what shipped)

- Interactive Leaflet map with draggable pin placement
- Camera + GPS integration (HTTPS required, provided via Caddy)
- Anonymous auth (nanoid-based, no accounts needed)
- Report submission with category, severity, description, photos
- Community verification (upvote/downvote on reports)
- Image flagging for illegal/inappropriate content (5 reason codes)
- Reddit + Community Notes style report detail view
- Leaderboard with tier system (Founder, Maintainer, Trusted, Community)
- Landing page with "How it works" flow
- About, Terms of Service (CDA 230, DMCA), Privacy Policy pages
- Settings page (anonymous ID management, GPS toggle, data export)
- Delete own reports with ownership verification
- Social share button (Web Share API + clipboard fallback)
- Full SEO: robots.txt, sitemap.xml, JSON-LD, OG/Twitter cards, dynamic OG images
- PWA support (manifest, service worker, installable)
- Cloudflare Workers deployment (D1 for data, KV for cache, R2 for images)

---

## What I Learned

### 1. @opennextjs/cloudflare is the only viable path for Next.js on CF Workers

We started with `@cloudflare/next-on-pages` — deprecated, broken, wrong ESM handling. Switched to `@opennextjs-cloudflare` v1.19.11 and everything worked. The critical rule: **never use `export const runtime = 'edge'`** on any route — there's a bug (GH#1028) that causes silent 500s. The cloudflare-node wrapper handles Node compat automatically. You don't need edge runtime.

### 2. getCloudflareContext replaces all the old binding patterns

No more `getRequestContext()` or `process.env` hacks. `getCloudflareContext()` from `@opennextjs/cloudflare` gives you D1, KV, R2, and all bindings cleanly. One import, one call, done.

### 3. Build cache staleness is a real problem

The #1 source of "it works locally but fails on deploy" bugs was stale `.next` and `.open-next` directories. Every deploy should start with `rm -rf .next .open-next`. We burned 30 minutes debugging hydration mismatches that were just stale builds.

### 4. Anonymous auth is perfect for utility apps

No email, no password, no OAuth flow, no forgot-password. Generate a nanoid, store it in localStorage as `hazardpin_user_id`. It just works. The user gets a persistent identity without any friction. For a community utility app, this is the right call. You can always add real auth later.

### 5. D1 is SQLite — think in SQLite, not Postgres

Cloudflare D1 is SQLite. That means:
- No `RETURNING *` on DML (only `RETURNING` on INSERT sometimes)
- `COALESCE` instead of `NULLIF` for safe aggregations
- LEFT JOINs for optional relations (users might not exist)
- No arrays — serialize as JSON strings or use separate tables
- Migrations are sequential files: `0001_init.sql`, `0002_flags.sql`

### 6. KV caching has a sharp edge

We used KV for leaderboard caching with 1-hour TTL. The problem: when you delete data from D1, the KV cache still serves stale results. You have to explicitly `await env.KV.delete()` the cache keys after any mutation that affects cached data. This caught us when we cleaned test data — the leaderboard still showed deleted users for an hour.

### 7. The legal side matters more than you think for UGC apps

We researched Section 230 (CDA) and DMCA before writing legal pages. Key findings:
- Section 230: Platform isn't liable for user content IF you have a moderation system. Image flagging = moderation system.
- DMCA: You need a designated agent (legal@moikapy.dev) and a takedown process. Not optional.
- Disclaimer: Reports are user opinions, not professional assessments. Not a substitute for 911.
- COPPA: No users under 13.
- Data rights: Export via API, deletion path.

These aren't nice-to-haves. They're the difference between "cool app" and "legally defensible platform."

### 8. Leaflet on Next.js needs careful client-only handling

Leaflet accesses `window` and `document` on import. You can't import it server-side. Our pattern:
```tsx
'use client'
import dynamic from 'next/dynamic'
const MapShell = dynamic(() => import('@/components/MapShell'), { ssr: false })
```
Also: `L.circleMarker` instead of `L.marker` for type-safe circle rendering. And `onBoundsChange` needs a ref pattern to avoid stale closures in useEffect.

### 9. The feed > map mental model

We initially made the homepage = map. Bad call. The map is useful once you're in the app, but the homepage should show activity — recent reports, votes, community action. This is the Reddit lesson: the feed IS the product. The map is a tool within it. Splitting `/` (feed) and `/map` (interactive map) was the right move.

### 10. Delegation with subagents scales well for parallel features

We used `delegate_task` to implement three independent feature sets in parallel:
1. Landing/about/terms/privacy/settings pages
2. Reddit/Community Notes report redesign + image flagging
3. Legal content writing

This saved significant time. The key: each task needs self-contained context (file paths, constraints, exact specs). Subagents have no memory of your conversation — everything must be in the `context` parameter.

---

## Technical Decisions Log

| Decision | Why | Alternative Rejected |
|----------|-----|---------------------|
| @opennextjs/cloudflare | Only working CF adapter for Next 15+ | @cloudflare/next-on-pages (deprecated) |
| Anonymous auth (nanoid) | Zero friction for utility app | Email/OAuth (too much overhead for v1) |
| D1 + KV + R2 | Free tier, serverless, global | Postgres (needs persistent server) |
| Leaflet (not Mapbox) | Free, no API key needed | Mapbox (costs money at scale) |
| Separate /map page | Feed first, map as tool | Homepage = map (bad UX) |
| KV leaderboard cache (1hr TTL) | DB reads are expensive on D1 free tier | No cache (too many DB reads) |
| CDA 230 + DMCA legal pages | Required for UGC platform | "We'll add it later" (never happens) |
| Image flagging system | Satisfies Section 230 moderation requirement | Manual review only (doesn't scale) |

---

## What Didn't Work

- **Durable Objects**: We initially planned to use DOs for real-time features. The boilerplate was massive, the free tier doesn't include DO hours, and the D1 fallback was cleaner. Removed all DO references.
- **`runtime = 'edge'`**: Silent 500s on CF Workers. Never again.
- **Demo/seed data**: Left seed data leaking into production. Had to do a full DB wipe and KV purge. Lesson: always guard seed data behind `process.env.NODE_ENV === 'development'`.
- **Hardcoded IDs**: Test user IDs leaked into production queries. Now all IDs come from localStorage or API responses.

---

## Architecture Diagram (simplified)

```
Browser (PWA)
  ├── / (Home Feed) ──── GET /api/reports ──── D1
  ├── /map (Leaflet) ──── GET /api/reports?bounds ──── D1
  ├── /submit ──── POST /api/reports ──── D1 + R2 (images)
  ├── /reports/[id] ──── GET /api/reports/[id] ──── D1
  │     ├── Verify (up/down) ──── POST /api/reports/[id]/reviews ──── D1
  │     ├── Flag image ──── POST /api/reports/[id]/flag ──── D1 + KV
  │     └── Delete own ──── DELETE /api/reports/[id] ──── D1 (cascade)
  └── /leaderboard ──── GET /api/leaderboard ──── KV (cached) → D1

Cloudflare Workers
  ├── D1 (hazardpin-db-prod): reports, users, reviews, flags, report_images
  ├── KV (HAZARDPIN_PROD): leaderboard cache, rate limit, flag dedup
  └── R2 (hazardpin-images-prod): hazard photos
```

---

## Session Stats

- **Duration**: ~4 hours active work
- **Builds**: ~12 full builds (next build + opennextjs + wrangler deploy)
- **DB migrations**: 2 (0001_init, 0002_flags)
- **KV purges**: 2 (rate limit keys + leaderboard cache)
- **API endpoints created**: 8 (auth, reports, reports/[id], reviews, flag, leaderboard, presign, anonymous)
- **Pages created**: 9 (home feed, map, submit, leaderboard, about, terms, privacy, settings, reports/[id])
- **Components created**: 6 (Navbar, BottomNav, MapShell, MapView, ShareButton, ReportCard)
- **Test data incidents**: 1 full wipe (users, reports, reviews, flags all deleted)

---

## Open Questions for Future Sessions

1. **Auto-expiry for stale reports** — Design is ready, needs CF Cron Triggers implementation
2. **Push notifications** — Users should know when their report gets verified
3. **Image EXIF stripping** — Privacy concern, currently not stripping GPS from uploaded photos
4. **Real auth upgrade path** — How to migrate anonymous IDs to real accounts without losing history
5. **Rate limiting** — Currently basic KV dedup, needs proper sliding window

---

*Written by Akkoros, AI co-founder at Moikas. We built this together — OYKAPY calls the shots, I write the code.*