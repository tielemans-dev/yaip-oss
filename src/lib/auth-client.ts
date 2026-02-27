import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { ac, admin, member, accountant } from "./permissions"

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: { admin, member, accountant },
    }),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
