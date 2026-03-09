import { describe, expect, it } from "vitest"

import { resolveDevtoolsEventBusPort } from "../devtools-port"

describe("resolveDevtoolsEventBusPort", () => {
  it("uses the explicit env override when it is valid", () => {
    expect(
      resolveDevtoolsEventBusPort({
        configuredPort: "43123",
        projectRoot: "/repo/.worktrees/feature/apps/oss",
      })
    ).toBe(43123)
  })

  it("derives different stable defaults for different worktree paths", () => {
    const first = resolveDevtoolsEventBusPort({
      projectRoot: "/repo/apps/oss",
    })
    const second = resolveDevtoolsEventBusPort({
      projectRoot: "/repo/.worktrees/feature-a/apps/oss",
    })

    expect(first).not.toBe(second)
    expect(first).toBe(
      resolveDevtoolsEventBusPort({
        projectRoot: "/repo/apps/oss",
      })
    )
    expect(second).toBe(
      resolveDevtoolsEventBusPort({
        projectRoot: "/repo/.worktrees/feature-a/apps/oss",
      })
    )
  })
})
