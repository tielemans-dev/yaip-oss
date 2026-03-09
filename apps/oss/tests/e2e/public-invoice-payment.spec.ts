import { expect, test } from "@playwright/test"
import { resetDatabase, seedPublicInvoice, waitForClientReady } from "./support"

test.beforeEach(async () => {
  await resetDatabase()
})

test("renders a public invoice payment page with checkout available", async ({ page }) => {
  const invoice = await seedPublicInvoice()

  await page.goto(invoice.url)
  await waitForClientReady(page)

  await expect(page.getByText(invoice.number)).toBeVisible()
  await expect(page.getByRole("button", { name: "Pay now" })).toBeVisible()
  await expect(page.getByText("Invoice from E2E Org")).toBeVisible()
})
