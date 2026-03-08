import path from "node:path"
import { fileURLToPath } from "node:url"

export type OssAppPaths = {
  srcRoot: string
  routesDirectory: string
  stylesEntry: string
  routerEntry: string
  routeTreeEntry: string
}

export function resolveOssAppPaths(): OssAppPaths {
  const buildDir = path.dirname(fileURLToPath(import.meta.url))
  const srcRoot = path.resolve(buildDir, "..")

  return {
    srcRoot,
    routesDirectory: path.join(srcRoot, "routes"),
    stylesEntry: path.join(srcRoot, "styles.css"),
    routerEntry: path.join(srcRoot, "router.tsx"),
    routeTreeEntry: path.join(srcRoot, "routeTree.gen.ts"),
  }
}
