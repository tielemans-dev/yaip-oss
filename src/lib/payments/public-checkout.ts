import { prisma } from "../db"
import { loadPublicInvoiceByToken } from "./public-access"
import { getPublicInvoicePaymentSecret } from "./public"
import { createStripeInvoiceCheckoutSession, getStripePaymentCredentials } from "./stripe"

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
