import { describe, expect, it } from "vitest"

import { resolveOssAppPaths } from "../resolve-app-paths"

describe("resolveOssAppPaths", () => {
  it("returns packaged route and style paths", () => {
    const paths = resolveOssAppPaths()

    expect(paths.routesDirectory.endsWith("/src/routes")).toBe(true)
    expect(paths.stylesEntry.endsWith("/src/styles.css")).toBe(true)
    expect(paths.routerEntry.endsWith("/src/router.tsx")).toBe(true)
    expect(paths.routeTreeEntry.endsWith("/src/routeTree.gen.ts")).toBe(true)
  })
})
