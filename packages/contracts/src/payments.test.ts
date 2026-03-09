import { describe, expect, it } from "vitest"
import {
  invoicePaymentTokenPayloadSchema,
  publicInvoiceCheckoutResultSchema,
  publicInvoiceTokenInputSchema,
} from "./payments"

describe("payments contracts", () => {
  it("parses token input and invoice payment payloads", () => {
    const input = publicInvoiceTokenInputSchema.parse({
      token: "signed-token",
    })
    const payload = invoicePaymentTokenPayloadSchema.parse({
      invoiceId: "inv_123",
      keyVersion: 1,
      scope: "invoice_payment",
    })

    expect(input.token).toBe("signed-token")
    expect(payload.scope).toBe("invoice_payment")
  })

  it("accepts typed public checkout results", () => {
    const parsed = publicInvoiceCheckoutResultSchema.parse({
      status: "redirect",
      url: "https://app.example.test/pay/signed-token",
    })

    expect(parsed.status).toBe("redirect")
  })
})
