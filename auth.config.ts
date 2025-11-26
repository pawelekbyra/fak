import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/',
  },
  providers: [],
} satisfies NextAuthConfig
