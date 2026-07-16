import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// NOTE: The JWT `token` is intentionally NOT augmented here. `next-auth/jwt`
// only re-exports `@auth/core/jwt` (so augmenting it is a no-op), and under pnpm
// `@auth/core` isn't resolvable as a direct module to augment either. The token
// therefore stays `Record<string, unknown>`; `src/auth.config.ts` narrows
// `token.id` / `token.role` with explicit casts where it reads them.
