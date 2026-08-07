import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  callbacks: {
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
})

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
