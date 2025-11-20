import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import * as bcrypt from "@node-rs/bcrypt"
import { authConfig } from "./auth.config"
import { z } from "zod"

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.id = user.id;
            token.role = (user as any).role;
            token.username = (user as any).username;
        }
        return token;
    },
    async session({ session, token }) {
        if (token && session.user) {
            session.user.id = token.id as string;
            (session.user as any).role = token.role as string;
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
