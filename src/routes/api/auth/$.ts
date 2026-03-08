import { createFileRoute } from "@tanstack/react-router"

async function handleAuthRequest(request: Request) {
  const { auth } = await import("../../../lib/auth")
  return auth.handler(request)
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleAuthRequest(request),
      POST: ({ request }: { request: Request }) => handleAuthRequest(request),
    },
  },
})
