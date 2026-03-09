import { createServerFn } from "@tanstack/react-start"
import {
  publicInvoiceCheckoutResultSchema,
  publicInvoiceTokenInputSchema,
} from "@yaip/contracts/payments"

export const getPublicInvoiceSession = createServerFn({ method: "GET" })
  .inputValidator(publicInvoiceTokenInputSchema)
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
  .inputValidator(publicInvoiceTokenInputSchema)
  .handler(async ({ data }) => {
    const { resolvePublicInvoiceCheckout } = await import("./public-checkout")
    return publicInvoiceCheckoutResultSchema.parse(
      await resolvePublicInvoiceCheckout(data.token)
    )
  })
