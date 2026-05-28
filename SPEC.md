# HazardPin Production Spec

## Vision

HazardPin is a community-powered road hazard reporter that makes reporting as fast as sending a text. Think Waze for potholes, debris, flooding, and road damage — gamified, dead-simple, and built for the least tech-savvy person on the road.

**Core principle: A 70-year-old with a flip-phone-era mindset should be able to report a pothole in under 10 seconds from their smartphone.**

---

## Problem Statement

Existing tools (SeeClickFix, FixMyStreet, 311 apps) all get the same complaints:
1. "It takes 10 minutes to file a report" — too many fields, too many steps
2. "Nobody fixes anything" — reports go into a black hole, no feedback loop
3. "I reported the same pothole 5 times" — no deduplication
4. "My email was shown publicly" — privacy disaster

---

## Key Differentiators

| Feature | HazardPin | SeeClickFix | 311 | Waze |
|---------|-----------|-------------|-----|------|
| Report time | <10 sec | 5+ min | 3+ min | N/A (auto) |
| Photo capture | PWA camera | Upload only | Upload only | Auto |
| GPS accuracy | watchPosition + drag pin | Single getCurrentPosition | Manual | GPS only |
| Deduplication | Geohash 24h window | None | None | Auto |
| Privacy | Anonymous by default, EXIF stripped | Public email | Varies | Username |
| Gamification | Points, tiers, streaks | None | None | Points, levels |
| Offline | Service worker cache | None | None | Partial |

---

## User Flows

### Flow 1: Quick Report (Primary — <10 seconds)

1. User opens app → GPS auto-locates (watchPosition, continuous refinement)
2. Big "🕳️ REPORT" button front and center
3. Tap → camera opens immediately (rear camera, environment facing)
4. Snap photo → auto-tagged with GPS coords + timestamp
5. One-tap category: Pothole / Debris / Flooding / Signage / Crack / Other
6. One-tap severity: 🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical
7. Drag pin on map to adjust exact location (if not standing at hazard)
8. Submit → Done. 10 seconds, 3 taps.

**Alternative path**: User searches address instead of GPS → pin drops at that address → drag to adjust.

### Flow 2: Browse Map (Discovery)

1. Open app → map centered on user's location
2. Colored pins show nearby hazards (red=pothole, orange=debris, blue=flooding, etc.)
3. Tap pin → popup with emoji category, severity, status, time ago, "View report →"
4. Scroll feed of recent reports in user's area below map (mobile: pull-up sheet)

### Flow 3: Verification (Gamification)

1. User drives/walks past a reported hazard
2. App sends push: "Pothole on S 2nd St — still there?" 
3. User taps ✅ Yes / ❌ No / 🔄 Changed (with optional photo)
4. Earns verification points → increases trust tier

---

## Information Architecture

### Pages

```
/ (Home)          → Full map view + floating report button
/submit           → Report form (camera, GPS, category, severity)
/reports/[id]     → Report detail (photos, status, verification)
/reports/[id]/reviews → Verification votes
/leaderboard      → Top reporters by points
/profile          → User stats, badges, reports (future)
```

### Bottom Navigation (Mobile)

```
🗺️ Map  |  ➕ Report  |  🏆 Board
```

---

## UI/UX Design Principles

### Dead Simple
- **3 taps maximum** to submit a report
- Every label must pass the "mom test" — can your mom figure it out without instructions?
- No login wall. Anonymous reporting by default.
- Big touch targets (minimum 44×44px). Fingers, not mice.

### Visual, Not Verbal
- Emojis for categories: 🕳️🚧🌊🪧💔❓ — instant recognition, no reading needed
- Color-coded severity: green/yellow/orange/red — universal language
- Map-first, form-second. The map IS the interface.

### Address Uncertainty
- GPS is unreliable (2+ mile offset on some devices/networks)
- **Always show a draggable pin** so users can adjust
- **Always offer address search** as a fallback
- Watch for GPS refinement: first reading might be IP-based, second reading 3-5m accurate
- Show accuracy confidence: "📍 GPS locked (±5m)" vs "📍 Approximate location (±2mi)"

### Progress, Not Black Holes
- Status badges: 🟡 Reported → 🔵 Under Review → 🟠 In Progress → 🟢 Fixed
- Notifications when status changes
- "Verified by 3 people" social proof

---

## Gamification System

### Points

| Action | Points |
|--------|--------|
| Submit a report | +10 |
| Attach photo | +5 bonus |
| Verify another report | +3 |
| Report gets marked "Fixed" | +10 bonus |
| 3 verifications on your report | +5 bonus |
| Daily login streak | +2 per day |

### Tiers

| Tier | Points | Badge | Perks |
|------|--------|-------|-------|
| Citizen | 0-49 | 👤 | Base features |
| Spotter | 50-149 | 🔍 | Reports prioritized |
| Scout | 150-299 | 🗺️ | Early access to new features |
| Ranger | 300-499 | ⭐ | Verified badge on reports |
| Warden | 500+ | 🛡️ | Can mark reports as fixed |

### Streaks
- 🔥 3-day streak: "On Fire" badge
- 🔥 7-day streak: "Road Warrior" badge
- 🔥 30-day streak: "HazardPin Legend" badge

---

## Anti-Abuse Systems

### Photo Moderation
1. **EXIF stripping** — canvas re-export removes all metadata (location, device, timestamp)
2. **Rate limiting** — 10 reports/day for Citizen tier, 20 for Spotter+
3. **AI pre-screen** — Cloudflare AI Workers check:
   - Is this actually a road/scene? (reject cat photos, selfies, screenshots)
   - Is this NSFW? (reject and flag)
   - Does it contain a license plate? (blur automatically)
4. **Deduplication** — Same geohash + same category + same user within 24h = merge, not new report
5. **Trust scores** — New users start at 0, verified reports increase trust. Low-trust reports need more verification.
6. **Community verification** — Other users can upvote "still there" or downvote "already fixed"
7. **No public reporter identity** — SeeClickFix's mistake. Reports show display name only, never email.

---

## Technical Architecture

### Stack
- **Framework**: Next.js 15.5.2 (App Router)
- **Runtime**: Cloudflare Workers (edge) + local Node.js dev
- **Database**: Cloudflare D1 (SQLite at edge) + sql.js (local dev)
- **Storage**: Cloudflare R2 (images)
- **Cache/KV**: Cloudflare KV (sessions, geohash clusters)
- **Auth**: NextAuth.js (GitHub OAuth + magic link for anonymous escalation)
- **Maps**: Leaflet + OpenStreetMap tiles (free, no API key)
- **Geocoding**: Nominatim (OSM) — free, rate-limited to 1 req/s
- **PWA**: Service Worker + Web App Manifest

### Database Schema (D1)

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'CITIZEN',
  points INTEGER DEFAULT 0,
  trust_score REAL DEFAULT 0.5,
  streak_days INTEGER DEFAULT 0,
  last_report_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Reports
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK(category IN ('POTHOLE','DEBRIS','FLOODING','FALLEN_SIGNAGE','ROAD_CRACK','OTHER')),
  severity TEXT NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  geohash TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'REPORTED' CHECK(status IN ('REPORTED','UNDER_REVIEW','IN_PROGRESS','FIXED','REJECTED')),
  verification_score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Report images (R2 keys)
CREATE TABLE report_images (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  image_key TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Verifications (upvote/downvote)
CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  verifier_id TEXT NOT NULL REFERENCES users(id),
  vote TEXT NOT NULL CHECK(vote IN ('STILL_THERE','FIXED','CHANGED')),
  photo_key TEXT,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(report_id, verifier_id)
);

-- Points ledger (append-only)
CREATE TABLE points_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  reference_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Geohash Strategy
- Use 8-character geohash (~19m precision) for reports
- Query neighboring geohashes for map bounds and dedup
- KV cache: `geohash:{prefix}` → list of report IDs for fast map tile lookups

### PWA Requirements
- `manifest.json` with `display: standalone`, theme color, icons (192/512)
- Service Worker: cache shell + map tiles offline
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- Install prompt on first visit (custom UI, not just browser bar)

---

## GPS Accuracy Fix

### Problem
`navigator.geolocation.getCurrentPosition()` with `maximumAge: 60000` can return stale or IP-based locations (2+ mile error). This is the #1 source of bad reports.

### Solution
1. **Use `watchPosition`** instead of `getCurrentPosition` — continuously refines accuracy
2. **`maximumAge: 0`** — never accept cached positions, always request fresh GPS
3. **`enableHighAccuracy: true`** — request GPS hardware, not WiFi/IP
4. **Show accuracy indicator** — display `coords.accuracy` in meters. If >100m, show yellow warning "Approximate location — drag pin to adjust"
5. **Always show draggable pin** — GPS gets you close, drag gets you exact
6. **Address search fallback** — Nominatim geocoding for when GPS fails completely
7. **Auto-recenter** — When accuracy improves (watchPosition callback), smoothly animate map center to new position if user hasn't dragged the pin

```typescript
// Best practice for GPS accuracy
navigator.geolocation.watchPosition(
  (pos) => {
    const accuracy = pos.coords.accuracy
    // accuracy < 20m: GPS-locked, green indicator
    // accuracy 20-100m: WiFi-assisted, yellow
    // accuracy > 100m: IP-based, red — suggest dragging
    updateUserLocation(pos.coords.latitude, pos.coords.longitude, accuracy)
  },
  (err) => { showManualEntry() },
  { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
)
```

---

## Implementation Roadmap

### Phase 1: Core Loop (Current — v0.1)
- [x] PWA manifest + service worker
- [x] Camera capture with EXIF stripping  
- [x] GPS watchPosition + draggable pin
- [x] Address search fallback (Nominatim)
- [x] Category grid + severity buttons
- [x] Demo API with seeded data
- [x] Map with colored SVG pins
- [x] HTTPS via Tailscale + Caddy proxy

### Phase 2: Auth + Real Data (v0.2)
- [ ] NextAuth.js (anonymous by default, GitHub OAuth for escalation)
- [ ] Cloudflare D1 production schema
- [ ] R2 presigned upload for real images
- [ ] Report detail page (reports/[id])
- [ ] Status flow: Reported → Under Review → In Progress → Fixed

### Phase 3: Verification + Gamification (v0.3)
- [ ] Verification flow (upvote/downvote on reports)
- [ ] Points system + leaderboard
- [ ] Trust tiers (Citizen → Spotter → Scout → Ranger → Warden)
- [ ] Daily streak tracking + badges
- [ ] Push notifications (status changes, nearby verifications)

### Phase 4: AI Moderation + Polish (v0.4)
- [ ] Cloudflare AI Workers for photo pre-screening
- [ ] License plate blurring (automatic)
- [ ] Geohash deduplication (24h window)
- [ ] Rate limiting per tier
- [ ] Accessibility audit (screen readers, keyboard nav, contrast)
- [ ] Offline service worker (submit offline → sync when online)

### Phase 5: Launch (v1.0)
- [ ] Custom domain (hazardpin.com or hazardpin.moikapy.dev)
- [ ] SEO + Open Graph meta tags
- [ ] Analytics (Cloudflare Web Analytics, privacy-first)
- [ ] Community guidelines + terms of service
- [ ] App store? (TWA wrapper for Google Play)

---

## Design References

- **Waze** for map-first interaction, big report button, community verification
- **Strava** for gamification loops, streaks, leaderboards
- **BeReal** for simplicity — open, snap, done
- **Nextdoor** for local community feel, trust verification

---

## Metrics for Success

| Metric | Target | How |
|--------|--------|-----|
| Report submission time | <10 seconds | Timing from tap to submit |
| Daily active reporters | Growing week over week | Analytics |
| Verification rate | >50% of reports get verified | DB query |
| Deduplication rate | <5% duplicate reports | Geohash analysis |
| Average GPS accuracy | <50m on mobile | Accuracy field tracking |
| User retention (7-day) | >30% | Analytics |