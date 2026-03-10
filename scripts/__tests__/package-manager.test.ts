import { existsSync, readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("repository Bun contract", () => {
  it("declares Bun as package manager and pins a Bun version file", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    ) as {
      packageManager?: string
      workspaces?: string[]
    }

    expect(packageJson.packageManager).toMatch(/^bun@/)
    expect(packageJson.workspaces).toEqual([".", "apps/*", "packages/*", "scripts"])
    expect(existsSync(new URL("../../.bun-version", import.meta.url))).toBe(true)
  })

  it("does not keep pnpm in active package scripts or helper commands", () => {
    const files = [
      "package.json",
      "apps/oss/package.json",
      "packages/contracts/package.json",
      "packages/shared/package.json",
      "scripts/package.json",
      "scripts/predev-bootstrap.mjs",
      "scripts/check-packed-build.mjs",
      "apps/oss/playwright.config.ts",
    ]

    for (const file of files) {
      const text = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8")
      expect(text).not.toContain("pnpm")
    }
  })

  it("does not leave pnpm in contributor-facing docs or workflows", () => {
    const files = [
      ".github/workflows/ci.yml",
      ".github/workflows/oss-boundary.yml",
      ".github/workflows/publish-package.yml",
      "README.md",
      "apps/oss/README.md",
      "CONTRIBUTING.md",
      "AGENTS.md",
      "CLAUDE.md",
    ]

    for (const file of files) {
      const text = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8")
      expect(text).not.toContain("pnpm")
    }
  })
})
