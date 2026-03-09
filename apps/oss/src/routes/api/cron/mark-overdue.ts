import { createFileRoute } from "@tanstack/react-router"

async function markOverdueInvoices() {
  const { prisma } = await import("../../../lib/db")
  return prisma.invoice.updateMany({
    where: {
      status: { in: ["sent", "viewed"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "overdue" },
  })
}

export const Route = createFileRoute("/api/cron/mark-overdue")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const secret = process.env.CRON_SECRET
        if (!secret) {
          return new Response("Server misconfigured: CRON_SECRET is required", {
            status: 503,
          })
        }

        const authHeader = request.headers.get("authorization")
        if (authHeader !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 })
        }

        const { count } = await markOverdueInvoices()

        return Response.json({ ok: true, marked: count })
      },
    },
  },
})
