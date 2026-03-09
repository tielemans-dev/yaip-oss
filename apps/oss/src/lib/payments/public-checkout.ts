import { buildAbsoluteUrl, resolveAppOrigin } from "@yaip/shared/http"
import { prisma } from "../db"
import { appLogger } from "../observability"
import { loadPublicInvoiceByToken } from "./public-access"
import { getPublicInvoicePaymentSecret } from "./public"
import { createStripeInvoiceCheckoutSession, getStripePaymentCredentials } from "./stripe"

const paymentsLogger = appLogger.child("payments")

export async function resolvePublicInvoiceCheckout(token: string) {
  const session = await loadPublicInvoiceByToken(token, getPublicInvoicePaymentSecret())
  if (!session) {
    paymentsLogger.warn("invoice.checkout.invalid", {
      tokenPresent: token.length > 0,
    })
    return { url: null, status: "invalid" } as const
  }

  if (session.paymentState === "paid") {
    paymentsLogger.info("invoice.checkout.already_paid", {
      invoiceId: session.invoice.id,
      organizationId: session.invoice.organizationId,
    })
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
    paymentsLogger.warn("invoice.checkout.unavailable", {
      invoiceId: session.invoice.id,
      organizationId: session.invoice.organizationId,
    })
    return { url: null, status: "unavailable" } as const
  }

  const publicUrl = buildAbsoluteUrl(
    resolveAppOrigin(
      [
        process.env.YAIP_APP_ORIGIN,
        process.env.BETTER_AUTH_URL,
        "http://localhost:3000",
      ],
      "http://localhost:3000"
    ),
    `/pay/${encodeURIComponent(token)}`
  )

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

  paymentsLogger.info("invoice.checkout.redirect", {
    invoiceId: session.invoice.id,
    organizationId: session.invoice.organizationId,
    checkoutSessionId: checkoutSession.id,
  })

  return { url: checkoutSession.url, status: "redirect" } as const
}
