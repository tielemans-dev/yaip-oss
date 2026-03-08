import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

const invoicePaymentTokenSchema = z.object({
  token: z.string().trim().min(1),
})

export const getPublicInvoiceSession = createServerFn({ method: "GET" })
  .inputValidator(invoicePaymentTokenSchema)
  .handler(async ({ data }) => {
    const [{ loadPublicInvoiceByToken }, { getPublicInvoicePaymentSecret }] = await Promise.all([
      import("./public-access"),
      import("./public"),
    ])
    const session = await loadPublicInvoiceByToken(data.token, getPublicInvoicePaymentSecret())
    if (!session) {
      return { kind: "invalid" } as const
    }

    return {
      kind: "ready",
      ...session,
    } as const
  })

export const beginPublicInvoiceCheckout = createServerFn({ method: "POST" })
  .inputValidator(invoicePaymentTokenSchema)
  .handler(async ({ data }) => {
    const { resolvePublicInvoiceCheckout } = await import("./public-checkout")
    return resolvePublicInvoiceCheckout(data.token)
  })
