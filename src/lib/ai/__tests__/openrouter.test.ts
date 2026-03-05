import { describe, expect, it } from "vitest"
import {
  extractJsonObjectFromText,
  fetchOpenRouterModelIds,
  generateInvoiceDraftWithOpenRouter,
  parseInvoiceDraftFromModelOutput,
} from "../openrouter"

describe("openrouter invoice draft parsing", () => {
  it("extracts json object from markdown fenced output", () => {
    const text = "Here you go:\n```json\n{\"notes\":\"Test\",\"items\":[{\"description\":\"Dev\",\"quantity\":2,\"unitPrice\":100}]}\n```"
    expect(extractJsonObjectFromText(text)).toBe(
      '{"notes":"Test","items":[{"description":"Dev","quantity":2,"unitPrice":100}]}'
    )
  })

  it("parses and normalizes invoice draft payload", () => {
    const draft = parseInvoiceDraftFromModelOutput(
      '{"contactId":"c1","contactName":"Acme","dueDate":"2030-01-20","taxRate":25,"notes":"Net 14","items":[{"description":"Design","quantity":1,"unitPrice":1200,"catalogItemId":"i1"}]}'
    )

    expect(draft.contactId).toBe("c1")
    expect(draft.contactName).toBe("Acme")
    expect(draft.taxRate).toBe(25)
    expect(draft.items).toEqual([
      { description: "Design", quantity: 1, unitPrice: 1200, catalogItemId: "i1" },
    ])
  })

  it("allows invoice items without unitPrice", () => {
    const draft = parseInvoiceDraftFromModelOutput(
      '{"items":[{"description":"1 gangs fræsning","quantity":1,"catalogItemId":"cat-1"}]}'
    )

    expect(draft.items).toEqual([
      { description: "1 gangs fræsning", quantity: 1, catalogItemId: "cat-1" },
    ])
  })

  it("allows invoice items without description", () => {
    const draft = parseInvoiceDraftFromModelOutput(
      '{"items":[{"quantity":1,"catalogItemId":"cat-1"}]}'
    )

    expect(draft.items).toEqual([{ quantity: 1, catalogItemId: "cat-1" }])
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

  it("throws tagged error when draft generation returns non-ok response", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      ({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      }) as Response) as typeof fetch

    await expect(
      generateInvoiceDraftWithOpenRouter({
        apiKey: "test-key",
        model: "openai/gpt-4o-mini",
        prompt: "Create a draft invoice for consulting work",
        todayIsoDate: "2026-03-03",
        contacts: [],
        catalogItems: [],
      })
    ).rejects.toMatchObject({
      _tag: "OpenRouterHttpError",
      status: 401,
    })

    global.fetch = originalFetch
  })

  it("throws tagged error when draft generation response is empty", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "   " } }],
        }),
      }) as Response) as typeof fetch

    await expect(
      generateInvoiceDraftWithOpenRouter({
        apiKey: "test-key",
        model: "openai/gpt-4o-mini",
        prompt: "Create a draft invoice for consulting work",
        todayIsoDate: "2026-03-03",
        contacts: [],
        catalogItems: [],
      })
    ).rejects.toMatchObject({
      _tag: "OpenRouterEmptyResponseError",
    })

    global.fetch = originalFetch
  })

  it("throws tagged error when models endpoint returns non-ok response", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      ({
        ok: false,
        status: 500,
        text: async () => "server error",
      }) as Response) as typeof fetch

    await expect(fetchOpenRouterModelIds("test-key")).rejects.toMatchObject({
      _tag: "OpenRouterHttpError",
      status: 500,
    })

    global.fetch = originalFetch
  })

  it("throws tagged error when models payload shape is invalid", async () => {
    const originalFetch = global.fetch
    global.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({
          data: "not-an-array",
        }),
      }) as Response) as typeof fetch

    await expect(fetchOpenRouterModelIds("test-key")).rejects.toMatchObject({
      _tag: "OpenRouterPayloadError",
    })

    global.fetch = originalFetch
  })
})
