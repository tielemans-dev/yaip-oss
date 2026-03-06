import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { PublicQuotePage } from "../public-quote-page"

const baseQuote = {
  id: "quote-1",
  number: "QTE-0001",
  status: "sent",
  issueDate: new Date("2026-03-01T00:00:00.000Z"),
  expiryDate: new Date("2026-03-15T00:00:00.000Z"),
  totalGross: { toNumber: () => 1250 },
  totalTax: { toNumber: () => 250 },
  subtotalNet: { toNumber: () => 1000 },
  currency: "USD",
  notes: "Net 14",
  sellerSnapshot: {
    companyName: "Acme Studio",
    companyEmail: "billing@acme.example",
    companyAddress: "Main Street 1",
  },
  buyerSnapshot: {
    name: "Buyer Name",
    email: "buyer@example.com",
    company: "Buyer Co",
  },
  publicDecisionAt: null,
  publicRejectionReason: null,
  contact: {
    name: "Buyer Name",
    email: "buyer@example.com",
    company: "Buyer Co",
  },
  items: [
    {
      id: "item-1",
      description: "Consulting",
      quantity: { toNumber: () => 2 },
      unitPriceGross: { toNumber: () => 625 },
      lineGross: { toNumber: () => 1250 },
      sortOrder: 0,
    },
  ],
  invoices: [],
}

describe("PublicQuotePage", () => {
  it("renders accept and reject actions while decision is pending", () => {
    const html = renderToStaticMarkup(
      <PublicQuotePage
        token="signed-token"
        state={{
          kind: "ready",
          decisionState: "pending",
          quote: baseQuote,
        }}
      />
    )

    expect(html).toContain("Accept quote")
    expect(html).toContain("Reject quote")
    expect(html).toContain("QTE-0001")
  })

  it("renders a read-only accepted state after acceptance", () => {
    const html = renderToStaticMarkup(
      <PublicQuotePage
        token="signed-token"
        state={{
          kind: "ready",
          decisionState: "accepted",
          quote: {
            ...baseQuote,
            status: "accepted",
            publicDecisionAt: new Date("2026-03-05T12:00:00.000Z"),
          },
        }}
      />
    )

    expect(html).toContain("Quote accepted")
    expect(html).not.toContain("Accept quote")
    expect(html).not.toContain("Reject quote")
  })

  it("renders a generic invalid-link state", () => {
    const html = renderToStaticMarkup(
      <PublicQuotePage
        token="signed-token"
        state={{
          kind: "invalid",
        }}
      />
    )

    expect(html).toContain("This quote link is invalid or has expired.")
  })
})
