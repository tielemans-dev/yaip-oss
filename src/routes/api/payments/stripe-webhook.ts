import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/payments/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const signature = request.headers.get("stripe-signature")
        if (!signature) {
          return new Response("Missing Stripe signature", { status: 400 })
        }

        const payload = await request.text()

        try {
          const { processStripeWebhookRequest } = await import("../../../lib/payments/webhooks")
          const result = await processStripeWebhookRequest(payload, signature)
          return Response.json({ ok: true, ...result })
        } catch {
          return new Response("Invalid Stripe webhook", { status: 400 })
        }
      },
    },
  },
})
