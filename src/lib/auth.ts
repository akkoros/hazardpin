import { getCloudflareEnv } from './cloudflare'
import type { NextRequest } from 'next/server'

export interface UserSession {
  userId: string
  email: string
  displayName?: string
  tier: string
}

export async function getSession(req: NextRequest): Promise<UserSession | null> {
  const env = getCloudflareEnv()
  const token = req.cookies.get('pothole-patrol.session')?.value ?? req.cookies.get('__Secure-next-auth.session-token')?.value
  if (!token) return null
  try {
    const raw = await env.KV.get(`session:${token}`)
    if (!raw) return null
    return JSON.parse(raw) as UserSession
  } catch {
    return null
  }
}
