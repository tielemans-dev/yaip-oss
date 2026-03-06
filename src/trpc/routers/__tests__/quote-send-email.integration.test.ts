import "dotenv/config"
import { randomUUID } from "node:crypto"
import { describe, expect, it, vi } from "vitest"

vi.mock("../../../lib/email", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/email")>(
    "../../../lib/email"
  )

  return {
    ...actual,
    sendQuoteEmail: vi.fn().mockResolvedValue({ id: "email_123" }),
  }
})

import { prisma } from "../../../lib/db"
import { sendQuoteEmail } from "../../../lib/email"
import { appRouter } from "../../router"

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
const describeIfDatabase = hasDatabaseUrl ? describe : describe.skip

describeIfDatabase("quote send email delivery", () => {
  it("issues public quote access on send and passes the link to the email layer", async () => {
    const orgId = randomUUID()
    const slug = `quote-send-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    const previousOrigin = process.env.YAIP_APP_ORIGIN
    const previousSecret = process.env.YAIP_PUBLIC_QUOTE_SECRET
    const previousResend = process.env.RESEND_API_KEY

    process.env.YAIP_APP_ORIGIN = "https://app.example.test"
    process.env.YAIP_PUBLIC_QUOTE_SECRET = "public-quote-secret-123456"
    process.env.RESEND_API_KEY = "resend_test_key"

    const caller = appRouter.createCaller({
      session: {
        user: {
          id: "quote-send-user",
          email: "quote-send@example.com",
          name: "Quote Send User",
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
          name: "Quote Send Org",
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

      const quote = await caller.quotes.create({
        contactId: contact.id,
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        taxRate: 25,
        items: [{ description: "Consulting", quantity: 2, unitPrice: 1000 }],
      })

      const result = await caller.quotes.send({ id: quote.id })

      expect(result.emailSent).toBe(true)

      const reloaded = await prisma.quote.findUniqueOrThrow({
        where: { id: quote.id },
        select: {
          status: true,
          publicAccessIssuedAt: true,
        },
      })

      expect(reloaded.status).toBe("sent")
      expect(reloaded.publicAccessIssuedAt).toBeTruthy()

      expect(sendQuoteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "buyer@example.com",
          publicQuoteUrl: expect.stringContaining("https://app.example.test/q/"),
        })
      )
    } finally {
      vi.mocked(sendQuoteEmail).mockClear()
      process.env.YAIP_APP_ORIGIN = previousOrigin
      process.env.YAIP_PUBLIC_QUOTE_SECRET = previousSecret
      process.env.RESEND_API_KEY = previousResend
      await prisma.organization.deleteMany({ where: { id: orgId } })
    }
  })
})
