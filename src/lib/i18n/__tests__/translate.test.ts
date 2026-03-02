import { describe, expect, it } from "vitest"
import { resolveLanguage, translate } from "../translate"

describe("i18n translate", () => {
  it("resolves supported language from locale", () => {
    expect(resolveLanguage("da-DK")).toBe("da")
    expect(resolveLanguage("en-US")).toBe("en")
    expect(resolveLanguage("fr-FR")).toBe("en")
  })

  it("returns danish translation when locale is da", () => {
    expect(translate("nav.dashboard", "da-DK")).toBe("Oversigt")
  })

  it("falls back to english translation", () => {
    expect(translate("nav.dashboard", "fr-FR")).toBe("Dashboard")
  })

  it("interpolates variables", () => {
    expect(translate("auth.welcome", "da-DK", { name: "Martin" })).toBe(
      "Velkommen, Martin"
    )
  })

  it("returns localized contacts labels", () => {
    expect(translate("contacts.title", "en-US")).toBe("Contacts")
    expect(translate("contacts.title", "da-DK")).toBe("Kontakter")
  })

  it("interpolates contact delete confirmation", () => {
    expect(
      translate("contacts.delete.description", "en-US", { name: "Emil" })
    ).toBe(
      "Are you sure you want to delete Emil? This action cannot be undone."
    )
    expect(
      translate("contacts.delete.description", "da-DK", { name: "Emil" })
    ).toBe(
      "Er du sikker på, at du vil slette Emil? Denne handling kan ikke fortrydes."
    )
  })

  it("returns localized accept-invitation status", () => {
    expect(translate("acceptInvitation.pending.title", "en-US")).toBe(
      "Accepting invitation"
    )
    expect(translate("acceptInvitation.pending.title", "da-DK")).toBe(
      "Accepterer invitation"
    )
  })
})
