import { describe, expect, it } from "vitest"
import { resolveInvoiceDueDate } from "../due-date"

describe("ai due date resolution", () => {
  const now = new Date("2026-03-02T12:00:00Z")

  it("resolves English relative month phrase from prompt", () => {
    expect(
      resolveInvoiceDueDate({
        prompt: "Emil should pay for one-time milling in 1 month.",
        modelDueDate: "2025-11-01",
        now,
      })
    ).toBe("2026-04-02")
  })

  it("resolves Danish relative month phrase from prompt", () => {
    expect(
      resolveInvoiceDueDate({
        prompt: "Emil skal betale for 1 gangs fræsning om 1 måned.",
        modelDueDate: "2025-11-01",
        now,
      })
    ).toBe("2026-04-02")
  })

  it("keeps model due date when prompt has no relative date phrase", () => {
    expect(
      resolveInvoiceDueDate({
        prompt: "Create invoice for Acme",
        modelDueDate: "2026-03-20",
        now,
      })
    ).toBe("2026-03-20")
  })
})
