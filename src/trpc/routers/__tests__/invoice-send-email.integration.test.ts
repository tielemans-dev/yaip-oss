import "dotenv/config"
import { randomUUID } from "node:crypto"
import { describe, expect, it, vi } from "vitest"

vi.mock("../../../lib/email", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/email")>(
    "../../../lib/email"
  )

  return {
    ...actual,
    sendInvoiceEmail: vi.fn().mockResolvedValue({ id: "email_123" }),
  }
})

import { prisma } from "../../../lib/db"
import { sendInvoiceEmail } from "../../../lib/email"
import { appRouter } from "../../router"

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
const describeIfDatabase = hasDatabaseUrl ? describe : describe.skip

describeIfDatabase("invoice send email delivery", () => {
  it("includes a public payment link in invoice email when Stripe is configured", async () => {
    const orgId = randomUUID()
    const slug = `invoice-send-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    const previousOrigin = process.env.YAIP_APP_ORIGIN
    const previousSecret = process.env.YAIP_PUBLIC_PAYMENT_SECRET
    const previousResend = process.env.RESEND_API_KEY

    process.env.YAIP_APP_ORIGIN = "https://app.example.test"
    process.env.YAIP_PUBLIC_PAYMENT_SECRET = "public-payment-secret-123456"
    process.env.RESEND_API_KEY = "resend_test_key"

    const caller = appRouter.createCaller({
      session: {
        user: {
          id: "invoice-send-user",
          email: "invoice-send@example.com",
          name: "Invoice Send User",
        },
        session: {
          activeOrganizationId: orgId,
        },
      },
    } as never)

    try {
      await prisma.organization.create({
        data: {
          id: orgId,
          name: "Invoice Send Org",
          slug,
          createdAt: new Date(),
          subscriptionStatus: "pro",
        },
      })

      await prisma.orgSettings.create({
        data: {
          organizationId: orgId,
          countryCode: "DK",
          locale: "da-DK",
          timezone: "Europe/Copenhagen",
          defaultCurrency: "DKK",
          currency: "DKK",
          taxRegime: "eu_vat",
          pricesIncludeTax: false,
          invoicePrefix: "INVEML",
          quotePrefix: "QTEEML",
        },
      })

      await caller.settings.update({
        stripePublishableKey: "pk_test_123456789",
        stripeSecretKey: "sk_test_12345678901234567890",
        stripeWebhookSecret: "whsec_12345678901234567890",
      })

      await prisma.organizationTaxId.create({
        data: {
          organizationId: orgId,
          scheme: "DK_CVR",
          value: "12345678",
          countryCode: "DK",
          isPrimary: true,
        },
      })

      const contact = await prisma.contact.create({
        data: {
          organizationId: orgId,
          name: "Buyer Name",
          email: "buyer@example.com",
          company: "Buyer Co",
          country: "DK",
        },
      })

      const invoice = await caller.invoices.create({
        contactId: contact.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        taxRate: 25,
        items: [{ description: "Consulting", quantity: 2, unitPrice: 1000 }],
      })

      const result = await caller.invoices.send({ id: invoice.id })

      expect(result.emailSent).toBe(true)

      const reloaded = await prisma.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        select: {
          status: true,
          publicPaymentIssuedAt: true,
        },
      })

      expect(reloaded.status).toBe("sent")
      expect(reloaded.publicPaymentIssuedAt).toBeTruthy()

      expect(sendInvoiceEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "buyer@example.com",
          publicPaymentUrl: expect.stringContaining("https://app.example.test/pay/"),
        })
      )
    } finally {
      vi.mocked(sendInvoiceEmail).mockClear()
      process.env.YAIP_APP_ORIGIN = previousOrigin
      process.env.YAIP_PUBLIC_PAYMENT_SECRET = previousSecret
      process.env.RESEND_API_KEY = previousResend
      await prisma.organization.deleteMany({ where: { id: orgId } })
    }
  })

  it("sends invoice email without payment CTA when Stripe is not configured", async () => {
    const orgId = randomUUID()
    const slug = `invoice-send-no-stripe-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    const previousResend = process.env.RESEND_API_KEY

    process.env.RESEND_API_KEY = "resend_test_key"

    const caller = appRouter.createCaller({
      session: {
        user: {
          id: "invoice-send-user-2",
          email: "invoice-send-2@example.com",
          name: "Invoice Send User 2",
        },
        session: {
          activeOrganizationId: orgId,
        },
      },
    } as never)

    try {
      await prisma.organization.create({
        data: {
          id: orgId,
          name: "Invoice Send No Stripe Org",
          slug,
          createdAt: new Date(),
          subscriptionStatus: "pro",
        },
      })

      await prisma.orgSettings.create({
        data: {
          organizationId: orgId,
          countryCode: "DK",
          locale: "da-DK",
          timezone: "Europe/Copenhagen",
          defaultCurrency: "DKK",
          currency: "DKK",
          taxRegime: "eu_vat",
          pricesIncludeTax: false,
          invoicePrefix: "INVNOS",
          quotePrefix: "QTENOS",
        },
      })

      await prisma.organizationTaxId.create({
        data: {
          organizationId: orgId,
          scheme: "DK_CVR",
          value: "12345678",
          countryCode: "DK",
          isPrimary: true,
        },
      })

      const contact = await prisma.contact.create({
        data: {
          organizationId: orgId,
          name: "Buyer Name",
          email: "buyer@example.com",
          company: "Buyer Co",
          country: "DK",
        },
      })

      const invoice = await caller.invoices.create({
        contactId: contact.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        taxRate: 25,
        items: [{ description: "Consulting", quantity: 2, unitPrice: 1000 }],
      })

      const result = await caller.invoices.send({ id: invoice.id })

      expect(result.emailSent).toBe(true)
      expect(sendInvoiceEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "buyer@example.com",
          publicPaymentUrl: null,
        })
      )
    } finally {
      vi.mocked(sendInvoiceEmail).mockClear()
      process.env.RESEND_API_KEY = previousResend
      await prisma.organization.deleteMany({ where: { id: orgId } })
    }
  })
})
