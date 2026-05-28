import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getCloudflareEnv } from '@/app/lib/cloudflare'
import { nanoid } from 'nanoid'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Upsert user into D1 on first sign-in
      const env = getCloudflareEnv()
      const email = user.email!
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
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
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string
        token.email = user.email!
      }
      return token
    },
    async session({ session, token }) {
      // Store session in KV
      const env = getCloudflareEnv()
      const sessionToken = nanoid()
      const payload = JSON.stringify({ userId: token.userId, email: token.email, tier: 'COMMUNITY' })
      await env.KV.put(`session:${sessionToken}`, payload, { expirationTtl: 7 * 24 * 3600 })
      ;(session as any).token = sessionToken
      return session
    },
  },
})

export { handler as GET, handler as POST }
