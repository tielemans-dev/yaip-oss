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
})
