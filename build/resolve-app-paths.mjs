import path from "node:path"
import { fileURLToPath } from "node:url"

export function resolveOssAppPaths() {
  const buildDir = path.dirname(fileURLToPath(import.meta.url))
  const packageRoot = path.resolve(buildDir, "..")
  const srcRoot = path.join(packageRoot, "src")

  return {
    srcRoot,
    routesDirectory: path.join(srcRoot, "routes"),
    stylesEntry: path.join(srcRoot, "styles.css"),
    routerEntry: path.join(srcRoot, "router.tsx"),
    routeTreeEntry: path.join(srcRoot, "routeTree.gen.ts"),
  }
}
