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
      // If updating, re-fetch user from DB to ensure token is fresh
      if (trigger === "update") {
        // Use token.sub (userId) to fetch fresh data
        if (token.sub) {
            try {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.sub }
                });
                if (freshUser) {
                    token.displayName = freshUser.displayName;
                    token.isFirstLogin = freshUser.isFirstLogin;
                    token.role = freshUser.role;
                    token.username = freshUser.username;
                    token.avatar = freshUser.avatar;
                }
            } catch (error) {
                console.error("Error fetching fresh user data in JWT callback:", error);
            }
        }
        return token;
      }

      // Initial sign in
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
            try {
                const parsedCredentials = z
                  .object({ login: z.string(), password: z.string() })
                  .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { login, password } = parsedCredentials.data;
                    let user = null;

                    // Normalize login input
                    const normalizedLogin = login.trim();

                    // Support login by email or username
                    if (normalizedLogin.includes('@')) {
                        user = await prisma.user.findUnique({ where: { email: normalizedLogin } });
                    } else {
                        user = await prisma.user.findUnique({ where: { username: normalizedLogin } });
                    }

                    if (!user) {
                        console.log(`Login failed: User '${normalizedLogin}' not found.`);
                        return null;
                    }

                    if (!user.password) {
                        console.log(`Login failed: User '${user.username}' has no password set.`);
                        return null;
                    }

                    // Use bcryptjs compare
                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        console.log(`Login successful for user: ${user.username}`);
                        return user;
                    } else {
                        console.log(`Login failed: Invalid password for user '${user.username}'.`);
                        return null;
                    }
                }

                console.log('Login failed: Invalid credentials format.');
                return null;
            } catch (error) {
                console.error('Unexpected authentication error:', error);
                return null;
            }
        }
    })
  ],
})
