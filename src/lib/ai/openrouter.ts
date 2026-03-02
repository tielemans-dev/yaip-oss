import { z } from "zod"

const invoiceDraftItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.number().positive().max(1_000_000),
  unitPrice: z.number().min(0).max(1_000_000_000),
  catalogItemId: z.string().trim().min(1).max(100).optional(),
})

const invoiceDraftSchema = z.object({
  contactId: z.string().trim().min(1).max(100).optional(),
  contactName: z.string().trim().max(200).optional(),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  items: z.array(invoiceDraftItemSchema).min(1).max(100),
})

type OpenRouterChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

type OpenRouterModelsResponse = {
  data?: Array<{
    id?: string
  }>
}

export type GeneratedInvoiceDraft = z.infer<typeof invoiceDraftSchema>

export const FALLBACK_OPENROUTER_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4.1-mini",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-2.0-flash-001",
]

export function extractJsonObjectFromText(text: string) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch?.[1]) {
    const fenced = fenceMatch[1].trim()
    if (fenced.startsWith("{") && fenced.endsWith("}")) {
      return fenced
    }
  }

  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1).trim()
  }

  return text.trim()
}

export function parseInvoiceDraftFromModelOutput(output: string): GeneratedInvoiceDraft {
  const jsonText = extractJsonObjectFromText(output)
  const parsed = JSON.parse(jsonText) as unknown
  return invoiceDraftSchema.parse(parsed)
}

export async function generateInvoiceDraftWithOpenRouter(input: {
  apiKey: string
  model: string
  prompt: string
  contacts: Array<{ id: string; name: string }>
  catalogItems: Array<{ id: string; name: string; description?: string | null }>
}) {
  const systemPrompt =
    "You generate structured invoice drafts. Respond only as JSON object with keys: contactId?, contactName?, dueDate?(YYYY-MM-DD), taxRate?, notes?, items[]. Each item must include description, quantity, unitPrice and may include catalogItemId. Prefer using provided contact/catalog IDs when possible."

  const toolingContext = JSON.stringify(
    {
      availableContacts: input.contacts.slice(0, 200),
      availableCatalogItems: input.catalogItems.slice(0, 300),
    },
    null,
    2
  )

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Context JSON:\n${toolingContext}` },
        { role: "user", content: input.prompt },
      ],
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenRouter request failed (${response.status}): ${errorBody.slice(0, 500)}`)
  }

  const payload = (await response.json()) as OpenRouterChatCompletionResponse
  const output = payload.choices?.[0]?.message?.content
  if (!output?.trim()) {
    throw new Error("OpenRouter returned an empty response")
  }

  return parseInvoiceDraftFromModelOutput(output)
}

export async function fetchOpenRouterModelIds(apiKey: string) {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenRouter models request failed (${response.status}): ${errorBody.slice(0, 500)}`)
  }

  const payload = (await response.json()) as OpenRouterModelsResponse
  const ids = (payload.data ?? [])
    .map((model) => model.id?.trim())
    .filter((id): id is string => Boolean(id))

  const uniqueSorted = Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b))
  return uniqueSorted
}
