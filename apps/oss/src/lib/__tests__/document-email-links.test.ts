import { describe, expect, it } from "vitest"
import {
  buildInvoiceEmailContent,
  buildQuoteEmailContent,
} from "../email"

describe("document email links", () => {
  it("includes the public quote URL in quote emails", () => {
    const result = buildQuoteEmailContent({
      quote: {
        number: "QTE-0001",
        issueDate: "2026-03-01T00:00:00.000Z",
        expiryDate: "2026-03-27T00:00:00.000Z",
        subtotal: 1000,
        taxAmount: 250,
        total: 1250,
        currency: "DKK",
        notes: "Thanks for the opportunity",
        items: [
          {
            description: "Consulting",
            quantity: 1,
            unitPrice: 1250,
            total: 1250,
          },
        ],
      },
      org: {
        companyName: "Nordic Services",
        companyEmail: "finance@nordic.test",
        locale: "en-US",
        timezone: "Europe/Copenhagen",
      },
      contactName: "Martin",
      publicQuoteUrl: "https://app.example.test/q/signed-token",
    } as never)

    expect(result.html).toContain("https://app.example.test/q/signed-token")
  })

  it("includes the payment URL in invoice emails when provided", () => {
    const result = buildInvoiceEmailContent({
      invoice: {
        number: "INV-0001",
        issueDate: "2026-03-01T00:00:00.000Z",
        dueDate: "2026-03-15T00:00:00.000Z",
        subtotal: 1000,
        taxAmount: 250,
        total: 1250,
        currency: "DKK",
        notes: "Net 14",
        items: [
          {
            description: "Consulting",
            quantity: 1,
            unitPrice: 1250,
            total: 1250,
          },
        ],
      },
      org: {
        companyName: "Nordic Services",
        companyEmail: "finance@nordic.test",
        locale: "en-US",
        timezone: "Europe/Copenhagen",
      },
      contactName: "Martin",
      publicPaymentUrl: "https://app.example.test/pay/signed-token",
    } as never)

    expect(result.html).toContain("https://app.example.test/pay/signed-token")
  })

  it("omits payment CTA copy when no payment URL is provided", () => {
    const result = buildInvoiceEmailContent({
      invoice: {
        number: "INV-0001",
        issueDate: "2026-03-01T00:00:00.000Z",
        dueDate: "2026-03-15T00:00:00.000Z",
        subtotal: 1000,
        taxAmount: 250,
        total: 1250,
        currency: "DKK",
        notes: "Net 14",
        items: [
          {
            description: "Consulting",
            quantity: 1,
            unitPrice: 1250,
            total: 1250,
          },
        ],
      },
      org: {
        companyName: "Nordic Services",
        companyEmail: "finance@nordic.test",
        locale: "en-US",
        timezone: "Europe/Copenhagen",
      },
      contactName: "Martin",
      publicPaymentUrl: null,
    } as never)

    expect(result.html).not.toContain("Pay this invoice")
  })
})
