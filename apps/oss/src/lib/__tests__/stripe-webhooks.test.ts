import "dotenv/config"
import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { prisma } from "../db"
import { encryptSecret } from "../secrets"
import { createStripeClient } from "../payments/stripe"
import { processStripeWebhookRequest } from "../payments/webhooks"

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
const describeIfDatabase = hasDatabaseUrl ? describe : describe.skip

describeIfDatabase("stripe webhook settlement", () => {
  it("marks invoices paid and handles repeated deliveries idempotently", async () => {
    const orgId = randomUUID()
    const contactId = randomUUID()
    const slug = `stripe-webhook-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    const webhookSecret = "whsec_test_12345678901234567890"

    try {
      await prisma.organization.create({
        data: {
          id: orgId,
          name: "Stripe Webhook Org",
          slug,
          createdAt: new Date(),
          subscriptionStatus: "pro",
        },
      })

      await prisma.orgSettings.create({
        data: {
          organizationId: orgId,
          stripePublishableKey: "pk_test_123456789",
          stripeSecretKeyEnc: encryptSecret("sk_test_12345678901234567890"),
          stripeWebhookSecretEnc: encryptSecret(webhookSecret),
        },
      })

      await prisma.contact.create({
        data: {
          id: contactId,
          organizationId: orgId,
          name: "Webhook Buyer",
          email: "buyer@example.com",
        },
      })

      const invoice = await prisma.invoice.create({
        data: {
          organizationId: orgId,
          contactId,
          number: "INV-WEBHOOK-1",
          status: "sent",
          paymentStatus: "unpaid",
          publicPaymentIssuedAt: new Date("2026-03-06T00:00:00.000Z"),
          dueDate: new Date("2026-03-20T00:00:00.000Z"),
          subtotalNet: "100.00",
          totalTax: "0.00",
          totalGross: "100.00",
          currency: "USD",
          countryCode: "US",
          locale: "en-US",
          timezone: "UTC",
          taxRegime: "us_sales_tax",
          pricesIncludeTax: false,
        },
      })

      const payload = JSON.stringify({
        id: "evt_test_1",
        object: "event",
        type: "checkout.session.completed",
        created: 1_772_761_600,
        data: {
          object: {
            id: "cs_test_123",
            object: "checkout.session",
            payment_intent: "pi_test_123",
            client_reference_id: invoice.id,
            metadata: {
              invoiceId: invoice.id,
              organizationId: orgId,
            },
          },
        },
      })

      const stripe = createStripeClient("sk_test_12345678901234567890")
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: webhookSecret,
      })

      const first = await processStripeWebhookRequest(payload, signature)
      expect(first.handled).toBe(true)
      expect(first.alreadyApplied).toBe(false)

      const afterFirst = await prisma.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
      })
      expect(afterFirst.paymentStatus).toBe("paid")
      expect(afterFirst.status).toBe("paid")
      expect(afterFirst.stripeCheckoutSessionId).toBe("cs_test_123")
      expect(afterFirst.stripePaymentIntentId).toBe("pi_test_123")

      const second = await processStripeWebhookRequest(payload, signature)
      expect(second.handled).toBe(true)
      expect(second.alreadyApplied).toBe(true)
    } finally {
      await prisma.organization.deleteMany({
        where: { id: orgId },
      })
    }
  })
})
