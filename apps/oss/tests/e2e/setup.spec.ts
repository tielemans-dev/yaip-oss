import { expect, test } from "@playwright/test"
import { resetDatabase, waitForClientReady } from "./support"

test.beforeEach(async () => {
  await resetDatabase()
})

test("completes the setup wizard and lands on login", async ({ page }) => {
  await page.goto("/setup")
  await waitForClientReady(page)

  await expect(page.getByText("Set up your YAIP instance")).toBeVisible()

  await page.getByRole("button", { name: "Next" }).click()
  await page.getByLabel("Organization name").fill("Setup Smoke Org")
  await page.getByLabel("Admin name").fill("Setup Smoke Admin")
  await page.getByLabel("Admin email").fill("setup-admin@example.com")
  await page.getByLabel("Admin password").fill("SetupSmoke123!")
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Next" }).click()
  await page.getByRole("button", { name: "Finish setup" }).click()

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole("status")).toContainText(
    "Setup complete. Please sign in to continue."
  )
})
