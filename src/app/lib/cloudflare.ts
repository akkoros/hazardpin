export function getRequestContext() {
  // Next-on-pages provides this via @cloudflare/next-on-pages; stub for local
  return {
    env: (globalThis as any).__env ?? {}
  }
}
