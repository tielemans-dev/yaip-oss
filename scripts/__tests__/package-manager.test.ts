import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("package.json packageManager", () => {
  it("declares a pnpm version for CI bootstrap", () => {
    const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
      packageManager?: string
    }

    expect(packageJson.packageManager).toBeDefined()
    expect(packageJson.packageManager).toMatch(/^pnpm@/)
  })
})
