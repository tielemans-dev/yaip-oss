import { prisma } from "../db"
import { decryptSecret } from "../secrets"
import { constructStripeWebhookEvent } from "./stripe"

export async function processStripeWebhookRequest(
  payload: string,
  signature: string
) {
  const candidateSettings = await prisma.orgSettings.findMany({
    where: {
      stripeWebhookSecretEnc: {
        not: null,
      },
    },
    select: {
      organizationId: true,
      stripeWebhookSecretEnc: true,
    },
  })

  for (const settings of candidateSettings) {
    try {
      const event = constructStripeWebhookEvent({
        payload,
        signature,
        webhookSecret: decryptSecret(settings.stripeWebhookSecretEnc ?? ""),
      })

      return processStripeWebhookEvent(event)
    } catch {
      continue
    }
  }

  throw new Error("Invalid Stripe webhook signature")
}

export async function processStripeWebhookEvent(event: {
  type: string
  created?: number
  data: {
    object: {
      id?: string
      payment_intent?: string | { id: string } | null
      client_reference_id?: string | null
      metadata?: Record<string, string | undefined> | null
    }
  }
}) {
  if (event.type !== "checkout.session.completed") {
    return { handled: false, alreadyApplied: false }
  }

  const session = event.data.object
  const invoiceId = session.metadata?.invoiceId ?? session.client_reference_id

  if (!invoiceId) {
    return { handled: false, alreadyApplied: false }
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
    },
  })

  if (!invoice) {
    return { handled: false, alreadyApplied: false }
  }

  if (invoice.paymentStatus === "paid" || invoice.status === "paid") {
    return { handled: true, alreadyApplied: true }
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "paid",
      paymentStatus: "paid",
      paidAt: event.created ? new Date(event.created * 1000) : new Date(),
      stripeCheckoutSessionId: session.id ?? null,
      stripePaymentIntentId: paymentIntentId,
      paymentFailureReason: null,
    },
  })

  return { handled: true, alreadyApplied: false }
}
