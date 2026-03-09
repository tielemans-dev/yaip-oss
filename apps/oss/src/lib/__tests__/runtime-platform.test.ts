import { afterEach, describe, expect, it } from "vitest"

import {
  getRuntimePlatform,
  resetRuntimePlatform,
  setRuntimePlatform,
  type RuntimePlatform,
} from "../runtime/platform"

function createFakePlatform(id: string): RuntimePlatform {
  return {
    id,
    getRuntimeKind: () => "worker",
    getEnv: () => undefined,
    getBinding: () => undefined,
    getPrisma: () => {
      throw new Error("unused in runtime platform tests")
    },
    getAuthHooks: () => ({}),
  }
}

describe("runtime platform registry", () => {
  afterEach(() => {
    resetRuntimePlatform()
  })

  it("returns the default platform when no override is installed", () => {
    expect(getRuntimePlatform().id).toBe("oss-node")
  })

  it("allows hosted boot code to replace the active platform", () => {
    const fake = createFakePlatform("cloud-worker")

    setRuntimePlatform(fake)

    expect(getRuntimePlatform()).toBe(fake)
  })
})
