import { createFileRoute } from "@tanstack/react-router"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "../../../trpc/router"
import { auth } from "../../../lib/auth"

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return fetchRequestHandler({
          endpoint: "/api/trpc",
          req: request,
          router: appRouter,
          createContext: async () => {
            const session = await auth.api.getSession({
              headers: request.headers,
            })
            return { session }
          },
        })
      },
      POST: async ({ request }: { request: Request }) => {
        return fetchRequestHandler({
          endpoint: "/api/trpc",
          req: request,
          router: appRouter,
          createContext: async () => {
            const session = await auth.api.getSession({
              headers: request.headers,
            })
            return { session }
          },
        })
      },
    },
  },
})
