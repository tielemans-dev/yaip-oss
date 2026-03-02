import { describe, expect, it } from "vitest"
import { extractJsonObjectFromText, fetchOpenRouterModelIds, parseInvoiceDraftFromModelOutput } from "../openrouter"

describe("openrouter invoice draft parsing", () => {
  it("extracts json object from markdown fenced output", () => {
    const text = "Here you go:\n```json\n{\"notes\":\"Test\",\"items\":[{\"description\":\"Dev\",\"quantity\":2,\"unitPrice\":100}]}\n```"
    expect(extractJsonObjectFromText(text)).toBe(
      '{"notes":"Test","items":[{"description":"Dev","quantity":2,"unitPrice":100}]}'
    )
  })

  it("parses and normalizes invoice draft payload", () => {
    const draft = parseInvoiceDraftFromModelOutput(
      '{"contactName":"Acme","dueDate":"2030-01-20","taxRate":25,"notes":"Net 14","items":[{"description":"Design","quantity":1,"unitPrice":1200}]}'
    )

    expect(draft.contactName).toBe("Acme")
    expect(draft.taxRate).toBe(25)
    expect(draft.items).toEqual([
      { description: "Design", quantity: 1, unitPrice: 1200 },
    ])
  })

  it("throws when model output has no parseable invoice items", () => {
    expect(() => parseInvoiceDraftFromModelOutput("not-json")).toThrow()
  })

  it("loads model ids from OpenRouter response", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({
          data: [{ id: "openai/gpt-4o-mini" }, { id: "anthropic/claude-3.5-sonnet" }],
        }),
      }) as Response) as typeof fetch

    await expect(fetchOpenRouterModelIds("test-key")).resolves.toEqual([
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
    ])

    global.fetch = originalFetch
  })
})
