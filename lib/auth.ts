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
          avatar: user.avatar,
          bio: user.bio,
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
        token.avatar = (user as any).avatar
        token.bio = (user as any).bio
      }
      // Refresh from DB on session update or when assessmentDone not set
      if (trigger === 'update' || !token.assessmentDone) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { assessmentDone: true, level: true, avatar: true, bio: true } })
          if (dbUser) {
            token.assessmentDone = dbUser.assessmentDone
            token.level = dbUser.level
            token.avatar = dbUser.avatar
            token.bio = dbUser.bio
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
        session.user.avatar = token.avatar as string | null
        session.user.bio = token.bio as string | null
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
