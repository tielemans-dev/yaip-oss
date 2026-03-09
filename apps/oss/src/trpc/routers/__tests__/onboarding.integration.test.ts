import "dotenv/config"
import { randomUUID } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { prisma } from "../../../lib/db"

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
const describeIfDatabase = hasDatabaseUrl ? describe : describe.skip

type CallerLike = {
  onboarding: {
    getStatus: () => Promise<{
      status: string
      isComplete: boolean
      missing: string[]
      values: Record<string, unknown>
    }>
    saveDraft: (input: Record<string, unknown>) => Promise<{
      status: string
      isComplete: boolean
      missing: string[]
      values: Record<string, unknown>
    }>
    completeManual: (input: { method?: "manual" | "ai" }) => Promise<{
      status: string
      isComplete: boolean
      missing: string[]
      values: Record<string, unknown>
    }>
  }
}

async function createCloudCaller() {
  vi.resetModules()
  process.env.YAIP_DISTRIBUTION = "cloud"

  const { appRouter } = await import("../../router")

  const orgId = randomUUID()
  const slug = `onboarding-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

  await prisma.organization.create({
    data: {
      id: orgId,
      name: "Onboarding Org",
      slug,
      createdAt: new Date(),
      subscriptionStatus: "pro",
    },
  })

  const caller = appRouter.createCaller({
    session: {
      user: {
        id: "onboarding-user",
        email: "onboarding@example.com",
        name: "Onboarding User",
      },
      session: {
        activeOrganizationId: orgId,
      },
    },
  } as never) as unknown as CallerLike

  return {
    orgId,
    caller,
  }
}

describeIfDatabase("onboarding router integration", () => {
  afterEach(async () => {
    process.env.YAIP_DISTRIBUTION = "selfhost"
  })

  it("returns status/missing/values and supports draft+complete flow", async () => {
    const { orgId, caller } = await createCloudCaller()

    try {
      const initial = await caller.onboarding.getStatus()
      expect(initial.status).toBe("not_started")
      expect(initial.isComplete).toBe(false)
      expect(initial.missing).toEqual(
        expect.arrayContaining(["companyName", "companyAddress", "companyEmail"])
      )

      const draft = await caller.onboarding.saveDraft({
        companyName: "Acme ApS",
        companyAddress: "Main St 1",
        companyEmail: "billing@acme.example",
        countryCode: "DK",
        locale: "da-DK",
        timezone: "Europe/Copenhagen",
        defaultCurrency: "DKK",
        taxRegime: "eu_vat",
        pricesIncludeTax: true,
        invoicePrefix: "INV",
        quotePrefix: "QTE",
        primaryTaxId: "12345678",
        primaryTaxIdScheme: "DK_CVR",
      })
      expect(draft.status).toBe("in_progress")
      expect(draft.missing).toEqual([])

      const completed = await caller.onboarding.completeManual({ method: "manual" })
      expect(completed.status).toBe("complete")
      expect(completed.isComplete).toBe(true)
      expect(completed.missing).toEqual([])
    } finally {
      await prisma.organization.deleteMany({ where: { id: orgId } })
    }
  })
})
