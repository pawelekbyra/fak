import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string;
      username: string | null;
      email: string;
      displayName: string | null;
      avatar: string | null;
      sessionVersion?: number;
      isFirstLogin?: boolean;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    sessionVersion?: number;
    isFirstLogin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    sessionVersion?: number;
    isFirstLogin?: boolean;
  }
}
