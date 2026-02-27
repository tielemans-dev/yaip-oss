import { describe, expect, it } from "vitest"
import {
  buildInvitationEmailContent,
  buildQuoteEmailContent,
} from "../email"

describe("email localization", () => {
  it("renders danish quote subject and content", () => {
    const result = buildQuoteEmailContent({
      quote: {
        number: "QTE-0001",
        issueDate: "2026-03-01T00:00:00.000Z",
        expiryDate: "2026-03-27T00:00:00.000Z",
        subtotal: 1000,
        taxAmount: 250,
        total: 1250,
        currency: "DKK",
        notes: "Tak for samarbejdet",
        items: [
          {
            description: "Konsulentydelse",
            quantity: 1,
            unitPrice: 1250,
            total: 1250,
          },
        ],
      },
      org: {
        companyName: "Nordic Services",
        companyEmail: "finance@nordic.test",
        locale: "da-DK",
        timezone: "Europe/Copenhagen",
      },
      contactName: "Martin",
    })

    expect(result.subject).toContain("Tilbud QTE-0001")
    expect(result.subject).toContain("gyldigt til")
    expect(result.html).toContain("Hej Martin, her er dit tilbud.")
    expect(result.html).toContain("Gyldig til")
  })

  it("renders danish invitation content", () => {
    const result = buildInvitationEmailContent({
      inviterName: "Mia",
      orgName: "Nordic Services",
      invitationUrl: "https://yaip.test/accept",
      locale: "da-DK",
    })

    expect(result.subject).toContain("Mia inviterede dig")
    expect(result.subject).toContain("Nordic Services")
    expect(result.html).toContain("Du er inviteret til at blive en del af Nordic Services")
    expect(result.html).toContain("Accepter invitation")
    expect(result.html).toContain("Denne invitation udløber om 48 timer.")
  })
})
