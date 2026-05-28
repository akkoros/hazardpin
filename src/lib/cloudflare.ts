import { getCloudflareContext } from '@opennextjs/cloudflare'

// ── Types ──
export interface Env {
  DB: D1Database
  KV: KVNamespace
  IMAGES: R2Bucket
  NEXT_PUBLIC_APP_URL?: string
  NEXT_PUBLIC_R2_PUBLIC_URL?: string
  R2_PUBLIC_URL?: string  // secret set via `wrangler secret put`
}

// ── Check Cloudflare runtime ──
function isCloudflare(): boolean {
  try {
    getCloudflareContext()
    return true
  } catch {
    return false
  }
}

// ── Cached local env ──
let _localEnv: Env | null = null

// ── Get env — works in both CF and local dev ──
export async function getCloudflareEnv(): Promise<Env> {
  if (isCloudflare()) {
    return getCloudflareContext().env as Env
  }
  if (!_localEnv) {
    await initLocalEnv()
  }
  return _localEnv!
}

// ── Initialize local dev environment ──
let _initPromise: Promise<Env> | null = null

export function initLocalEnv(): Promise<Env> {
  if (isCloudflare()) return Promise.resolve(getCloudflareContext().env as Env)
  if (_localEnv) return Promise.resolve(_localEnv)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const { readFileSync, writeFileSync, existsSync, mkdirSync } = await import('fs')
    const { join } = await import('path')
    const initSqlJs = require('sql.js')
    const SQL = await initSqlJs({
      locateFile: (file: string) => join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    })

    const dbDir = join(process.cwd(), '.local-db')
    const dbPath = join(dbDir, 'hazardpin.db')
    if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

    let db: any
    if (existsSync(dbPath)) {
      db = new SQL.Database(new Uint8Array(readFileSync(dbPath)))
      // Apply any pending migrations
      applyMigrations(db, persistDb, dbPath, writeFileSync)
    } else {
      db = new SQL.Database()
      const initPath = join(process.cwd(), 'db/migrations/0001_init.sql')
      if (existsSync(initPath)) {
        db.exec(readFileSync(initPath, 'utf-8'))
        console.log('[HazardPin] Local DB initialized with schema')
      }
      applyMigrations(db, persistDb, dbPath, writeFileSync)
    }

    // Seed demo data if empty (local dev only)
    try {
      const result = db.exec('SELECT COUNT(*) as cnt FROM hazard_reports')
      if (result[0]?.values[0]?.[0] === 0 && process.env.NODE_ENV !== 'production') {
        console.log('[HazardPin] Seeding demo data...')
        seedDemoData(db)
        persistDb(db, dbPath, writeFileSync)
      }
    } catch { /* table might not exist yet */ }

    const kvStore = new Map<string, { value: string; expiresAt?: number }>()
    _localEnv = {
      DB: createLocalD1(db, dbPath, writeFileSync),
      KV: createLocalKV(kvStore),
      IMAGES: createLocalR2(),
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_R2_PUBLIC_URL: '/api/upload',
      R2_PUBLIC_URL: '/api/upload',
    }

    return _localEnv
  })()

  return _initPromise
}

// ── Apply pending migrations ──
function applyMigrations(db: any, persist: (db: any) => void, dbPath: string, writeFileSync: typeof import('fs').writeFileSync) {
  const persistDb = () => writeFileSync(dbPath, Buffer.from(db.export()))
  const migrationsDir = join(process.cwd(), 'db/migrations')
  if (!existsSync(migrationsDir)) return

  // Create migrations tracking table
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, appliedAt INTEGER NOT NULL)`)
  } catch { /* already exists */ }

  const applied: Set<string> = new Set()
  try {
    const stmt = db.prepare('SELECT name FROM _migrations')
    while (stmt.step()) applied.add(stmt.getAsObject().name as string)
    stmt.free()
  } catch { /* no migrations table yet */ }

  const { readdirSync } = require('fs') as typeof import('fs')
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  for (const file of files) {
    if (applied.has(file)) continue
    console.log(`[HazardPin] Applying migration: ${file}`)
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    // Handle multi-statement: split by semicolons and run each
    for (const stmt of sql.split(';')) {
      const trimmed = stmt.trim()
      if (trimmed) {
        try { db.exec(trimmed) } catch (e: any) {
          // Allow ALTER TABLE "column already exists" errors
          if (!String(e?.message || '').includes('duplicate column')) throw e
        }
      }
    }
    const now = Math.floor(Date.now() / 1000)
    db.exec(`INSERT OR IGNORE INTO _migrations (name, appliedAt) VALUES ('${file}', ${now})`)
    persistDb()
  }
}

// ── Persist ──
function persistDb(db: any, dbPath: string, writeFileSync: typeof import('fs').writeFileSync) {
  writeFileSync(dbPath, Buffer.from(db.export()))
}

// ── Seed ──
function seedDemoData(db: any) {
  const now = Math.floor(Date.now() / 1000)
  db.exec(`INSERT OR IGNORE INTO users (id, email, displayName, tier, role, createdAt, updatedAt) VALUES ('demo-user','demo@hazardpin.dev','Demo User','COMMUNITY','USER',${now},${now})`)

  const hazards: [string, string, string, string, string, number, number, string][] = [
    ['demo-1', 'demo-user', 'POTHOLE', 'HIGH', 'Large pothole on Main St', 40.7580, -73.9855, 'NEW'],
    ['demo-2', 'demo-user', 'DEBRIS', 'MEDIUM', 'Fallen tree branch blocking bike lane', 40.7614, -73.9776, 'VERIFIED'],
    ['demo-3', 'demo-user', 'FLOODING', 'CRITICAL', 'Intersection floods after rain', 40.7484, -73.9857, 'UNDER_REVIEW'],
    ['demo-4', 'demo-user', 'POTHOLE', 'LOW', 'Small pothole near sidewalk', 40.7527, -73.9772, 'NEW'],
    ['demo-5', 'demo-user', 'ROAD_CRACK', 'MEDIUM', 'Longitudinal crack across lane', 40.7449, -73.9917, 'VERIFIED'],
  ]

  for (const [id, rid, cat, sev, desc, lat, lng, status] of hazards) {
    const gh = simpleGeohash(lat, lng)
    db.exec(`INSERT OR IGNORE INTO hazard_reports (id, reporterId, category, severity, description, latitude, longitude, address, status, geohash, createdAt, updatedAt) VALUES ('${id}','${rid}','${cat}','${sev}','${desc}',${lat},${lng},'','${status}','${gh}',${now},${now})`)
  }
}

function simpleGeohash(lat: number, lng: number): string {
  const b32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let hash = '', loLat = -90, hiLat = 90, loLng = -180, hiLng = 180, bit = 0, ch = 0
  while (hash.length < 8) {
    if (bit % 2 === 0) {
      const mLng = (loLng + hiLng) / 2
      if (lng >= mLng) { ch = ch * 2 + 1; loLng = mLng } else { ch = ch * 2; hiLng = mLng }
    } else {
      const mLat = (loLat + hiLat) / 2
      if (lat >= mLat) { ch = ch * 2 + 1; loLat = mLat } else { ch = ch * 2; hiLat = mLat }
    }
    bit++
    if (bit % 5 === 0) { hash += b32[ch]; ch = 0 }
  }
  return hash
}

// ── Stub env ──
function createStubEnv(): Env {
  const err = () => { throw new Error('CF bindings not available. Run `wrangler dev` or call initLocalEnv().') }
  return {
    DB: { prepare: () => ({ bind: () => ({ first: err, all: err, run: err }) }) } as unknown as D1Database,
    KV: { get: async () => null, put: async () => {} } as unknown as KVNamespace,
    IMAGES: {} as R2Bucket,
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_R2_PUBLIC_URL: '',
    R2_PUBLIC_URL: '',
  }
}

// ── Local D1 ──
function createLocalD1(db: any, dbPath: string, writeFileSync: typeof import('fs').writeFileSync): D1Database {
  const persist = () => writeFileSync(dbPath, Buffer.from(db.export()))
  const d1 = {
    prepare: (query: string) => {
      let idx = 0
      const converted = query.replace(/\?/g, () => `$${++idx}`)
      let params: any[] = []
      return {
        bind: (...p: any[]) => { params = p; return {
          first: async () => {
            try { const stmt = db.prepare(converted); if (params.length) stmt.bind(params); const hasRow = stmt.step(); const row = hasRow ? stmt.getAsObject() : null; stmt.free(); return row }
            catch (e) { console.error('[LocalD1] first:', e); return null }
          },
          all: async () => {
            try { const stmt = db.prepare(converted); if (params.length) stmt.bind(params); const results: any[] = []; while (stmt.step()) results.push(stmt.getAsObject()); stmt.free(); return { results, success: true, meta: {} } }
            catch (e) { console.error('[LocalD1] all:', e); return { results: [], success: true, meta: {} } }
          },
          run: async () => {
            try { const stmt = db.prepare(converted); if (params.length) stmt.bind(params); stmt.step(); stmt.free(); persist(); return { success: true, meta: {} } }
            catch (e) { console.error('[LocalD1] run:', e); return { success: true, meta: {} } }
          },
        }},
      }
    },
    exec: async (sql: string) => { try { db.exec(sql); persist(); return { success: true as const, meta: {} } } catch (e) { console.error('[LocalD1] exec:', e); return { success: true as const, meta: {} } } },
    batch: async (stmts: any[]) => { const results: any[] = []; for (const s of stmts) { try { results.push(await s.run?.() ?? await s.all?.()) } catch { results.push({ success: true, meta: {} }) } } persist(); return results },
    withSession: () => { throw new Error('withSession not available in local dev') },
    dump: async () => new Uint8Array(db.export()),
  }
  return d1 as unknown as D1Database
}

// ── Local KV ──
function createLocalKV(store: Map<string, { value: string; expiresAt?: number }>): KVNamespace {
  const check = (key: string) => {
    const e = store.get(key)
    if (e?.expiresAt && Date.now() > e.expiresAt) { store.delete(key); return null }
    return e
  }
  return {
    get: async (key: string) => check(key)?.value ?? null,
    put: async (key: string, value: string, opts?: any) => { store.set(key, { value, expiresAt: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined }) },
    delete: async (key: string) => { store.delete(key) },
    list: async () => ({ keys: [], list_complete: true }) as any,
  } as KVNamespace
}

// ── Local R2 ──
function createLocalR2(): R2Bucket {
  const err = () => Promise.reject(new Error('R2 not available in local dev. Use wrangler dev for R2.'))
  return { get: err, put: err, delete: err, list: async () => ({ objects: [], delimitedPrefixes: [] }) as any, head: err, createMultipartUpload: err, resumeMultipartUpload: err } as R2Bucket
}