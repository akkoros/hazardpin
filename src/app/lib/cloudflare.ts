import { getRequestContext } from '@cloudflare/next-on-pages'

export function getCloudflareEnv(): any {
  try {
    return getRequestContext().env
  } catch {
    return (globalThis as any).__env ?? {}
  }
}
