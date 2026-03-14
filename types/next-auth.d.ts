import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      level: string
      language: string
      assessmentDone: boolean
      avatar?: string | null
      bio?: string | null
    }
  }

  interface User {
    id: string
    name: string
    email: string
    level: string
    language: string
    assessmentDone: boolean
    avatar?: string | null
    bio?: string | null
  }
}
