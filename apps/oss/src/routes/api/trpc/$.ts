import { createFileRoute } from "@tanstack/react-router"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

async function handleTrpcRequest(request: Request) {
  const [{ appRouter }, { auth }] = await Promise.all([
    import("../../../trpc/router"),
    import("../../../lib/auth"),
  ])

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
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleTrpcRequest(request),
      POST: ({ request }: { request: Request }) => handleTrpcRequest(request),
    },
  },
})
