import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import * as bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { z } from "zod"
import { Adapter } from "next-auth/adapters"

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  // Explicit cast to Adapter to bypass strict type checks between PrismaAdapter and NextAuth Adapter
  // caused by our custom fields in User model
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        token.displayName = session.user.displayName;
        token.isFirstLogin = session.user.isFirstLogin;
        return token;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
        token.isFirstLogin = user.isFirstLogin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.displayName = token.displayName;
        session.user.avatar = token.avatar;
        session.user.isFirstLogin = token.isFirstLogin;
      }
      return session;
    }
  },
  providers: [
    Credentials({
        async authorize(credentials) {
            const parsedCredentials = z
              .object({ login: z.string(), password: z.string() })
              .safeParse(credentials);

            if (parsedCredentials.success) {
                const { login, password } = parsedCredentials.data;
                let user = null;

                if (login.includes('@')) {
                    user = await prisma.user.findUnique({ where: { email: login } });
                } else {
                    user = await prisma.user.findUnique({ where: { username: login } });
                }

                if (!user) return null;
                if (!user.password) return null; // User might exist via OAuth (if added later) but no password

                const passwordsMatch = await bcrypt.compare(password, user.password);

                if (passwordsMatch) return user;
            }
            console.log('Invalid credentials');
            return null;
        }
    })
  ],
})
