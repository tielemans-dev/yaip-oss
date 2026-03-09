import { expect, test } from "@playwright/test"
import { prisma } from "../../src/lib/db"
import { resetDatabase, seedPublicQuote, waitForClientReady } from "./support"

test.beforeEach(async () => {
  await resetDatabase()
})

test("allows a customer to accept a public quote", async ({ page }) => {
  const quote = await seedPublicQuote()

  await page.goto(quote.url)
  await waitForClientReady(page)

  await expect(page.getByText(quote.number)).toBeVisible()
  await page.getByRole("button", { name: "Accept quote" }).click()

  await expect(page.getByText("Quote accepted")).toBeVisible()
  await expect
    .poll(async () => {
      const current = await prisma.quote.findUnique({
        where: { id: quote.id },
        select: { status: true },
      })
      return current?.status
    })
    .toBe("accepted")
})
