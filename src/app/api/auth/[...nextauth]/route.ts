import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: (() => {
        const env = getCloudflareEnv()
        return (env.GOOGLE_CLIENT_ID as string) || ''
      })(),
      clientSecret: (() => {
        const env = getCloudflareEnv()
        return (env.GOOGLE_CLIENT_SECRET as string) || ''
      })(),
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const env = getCloudflareEnv()
        const email = user.email!
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first() as { id: string } | null
        if (!existing) {
          const id = nanoid()
          await env.DB.prepare(
            `INSERT INTO users (id, email, displayName, avatarUrl, tier, role, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, 'COMMUNITY', 'USER', ?, ?)`
          ).bind(id, email, user.name || '', user.image || '', Math.floor(Date.now()/1000), Math.floor(Date.now()/1000)).run()
          user.id = id
        } else {
          user.id = existing.id
        }
        // Store session token in KV so session callback can reference it
        const sessionToken = nanoid()
        ;(user as any).__sessionToken = sessionToken
        await env.KV.put('session:' + sessionToken, JSON.stringify({ userId: user.id, email, tier: 'COMMUNITY' }), { expirationTtl: 7 * 24 * 3600 })
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string
        token.email = user.email!
        token.sessionToken = (user as any).__sessionToken as string | undefined
      }
      return token
    },
    async session({ session, token }) {
      const env = getCloudflareEnv()
      const sessionToken = token.sessionToken as string | undefined
      if (sessionToken) {
        const raw = await env.KV.get('session:' + sessionToken)
        if (raw) {
          const payload = JSON.parse(raw) as { userId: string; email: string; tier: string }
          ;(session as any).user = { ...session.user, id: payload.userId, email: payload.email, tier: payload.tier }
        }
        ;(session as any).token = sessionToken
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
