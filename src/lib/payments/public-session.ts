import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { loadPublicInvoiceByToken } from "./public-access"
import { getPublicInvoicePaymentSecret } from "./public"
import { resolvePublicInvoiceCheckout } from "./public-checkout"

const invoicePaymentTokenSchema = z.object({
  token: z.string().trim().min(1),
})

export const getPublicInvoiceSession = createServerFn({ method: "GET" })
  .inputValidator(invoicePaymentTokenSchema)
  .handler(async ({ data }) => {
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
    return resolvePublicInvoiceCheckout(data.token)
  })
