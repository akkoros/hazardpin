// Initialize local dev environment on app startup
// In Cloudflare (wrangler dev / deployed), this is a no-op
// In local next dev, it sets up sql.js with local SQLite
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initLocalEnv } = await import('./lib/cloudflare')
    await initLocalEnv()
    console.log('[HazardPin] Local dev environment initialized')
  }
}