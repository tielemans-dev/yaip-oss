import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { auth } = await import("./auth")
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    return session
  }
)
