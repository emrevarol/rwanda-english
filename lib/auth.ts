import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) return null

        if (!user.emailVerified) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          level: user.level,
          language: user.language,
          assessmentDone: user.assessmentDone,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.level = (user as any).level
        token.language = (user as any).language
        token.assessmentDone = (user as any).assessmentDone
      }
      // Refresh assessmentDone from DB on every session update
      if (trigger === 'update' || !token.assessmentDone) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { assessmentDone: true, level: true } })
          if (dbUser) {
            token.assessmentDone = dbUser.assessmentDone
            token.level = dbUser.level
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.level = token.level as string
        session.user.language = token.language as string
        session.user.assessmentDone = token.assessmentDone as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/en/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
