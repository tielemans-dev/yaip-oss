import { describe, expect, it } from "vitest"

// @ts-expect-error Local .mjs helper has no TypeScript declaration file yet.
const { resolveDatabaseTarget } = (await import("../predev-bootstrap-lib.mjs")) as {
  resolveDatabaseTarget: (databaseUrl: string | undefined) =>
    | { kind: "missing" }
    | { kind: "invalid" }
    | { kind: "local"; host: string }
    | { kind: "remote"; host: string }
}

describe("resolveDatabaseTarget", () => {
  it("treats localhost postgres URLs as local", () => {
    expect(
      resolveDatabaseTarget("postgresql://postgres:postgres@localhost:5432/yaip")
    ).toEqual({ kind: "local", host: "localhost" })
  })

  it("treats non-local URLs as remote", () => {
    expect(
      resolveDatabaseTarget("postgresql://postgres:postgres@db.internal:5432/yaip")
    ).toEqual({ kind: "remote", host: "db.internal" })
  })

  it("returns missing when DATABASE_URL is blank", () => {
    expect(resolveDatabaseTarget("")).toEqual({ kind: "missing" })
    expect(resolveDatabaseTarget(undefined)).toEqual({ kind: "missing" })
  })

  it("returns invalid for malformed URLs", () => {
    expect(resolveDatabaseTarget("not-a-url")).toEqual({ kind: "invalid" })
  })
})
