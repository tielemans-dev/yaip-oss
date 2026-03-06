import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { prisma } from "../db"
import { loadPublicInvoiceByToken } from "./public-access"
import { getPublicInvoicePaymentSecret } from "./public"
import { getStripePaymentCredentials } from "./stripe"
import { createStripeInvoiceCheckoutSession } from "./stripe"

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

export async function resolvePublicInvoiceCheckout(token: string) {
  const session = await loadPublicInvoiceByToken(token, getPublicInvoicePaymentSecret())
  if (!session) {
    return { url: null, status: "invalid" } as const
  }

  if (session.paymentState === "paid") {
    return { url: null, status: "paid" } as const
  }

  const settings = await prisma.orgSettings.findUnique({
    where: { organizationId: session.invoice.organizationId },
    select: {
      stripePublishableKey: true,
      stripeSecretKeyEnc: true,
      stripeWebhookSecretEnc: true,
    },
  })

  const credentials = getStripePaymentCredentials({
    stripePublishableKey: settings?.stripePublishableKey ?? null,
    stripeSecretKeyEnc: settings?.stripeSecretKeyEnc ?? null,
    stripeWebhookSecretEnc: settings?.stripeWebhookSecretEnc ?? null,
  })

  if (!credentials) {
    return { url: null, status: "unavailable" } as const
  }

  const publicUrl = new URL(
    `/pay/${encodeURIComponent(token)}`,
    process.env.YAIP_APP_ORIGIN ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  ).toString()

  const checkoutSession = await createStripeInvoiceCheckoutSession({
    credentials,
    invoice: session.invoice,
    successUrl: publicUrl,
    cancelUrl: publicUrl,
  })

  await prisma.invoice.update({
    where: { id: session.invoice.id },
    data: {
      stripeCheckoutSessionId: checkoutSession.id,
    },
  })

  return { url: checkoutSession.url, status: "redirect" } as const
}

export const beginPublicInvoiceCheckout = createServerFn({ method: "POST" })
  .inputValidator(invoicePaymentTokenSchema)
  .handler(async ({ data }) => {
    return resolvePublicInvoiceCheckout(data.token)
  })
