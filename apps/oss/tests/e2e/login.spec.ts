import { expect, test } from "@playwright/test"
import {
  loginAsAdmin,
  resetDatabase,
  seedCompletedSetup,
  uniqueEmail,
  waitForClientReady,
} from "./support"

test.beforeEach(async () => {
  await resetDatabase()
})

test("lets the initial admin sign in to the dashboard", async ({ page }) => {
  await seedCompletedSetup()

  await loginAsAdmin(page)

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
})

test("lets a new user sign up and continue to onboarding", async ({ page }) => {
  await seedCompletedSetup()

  await page.goto("/signup")
  await waitForClientReady(page)
  await page.getByLabel("Name").fill("New Signup User")
  await page.getByLabel("Email").fill(uniqueEmail("signup"))
  await page.getByLabel("Password").fill("SignupSmoke123!")
  await page.getByRole("button", { name: "Sign up" }).click()

  await expect(page).toHaveURL(/\/onboarding/)
  await expect(page.getByText("Create your organization")).toBeVisible()
})
