import { execFileSync } from "node:child_process"
import { mkdtempSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const outDir = mkdtempSync(path.join(tmpdir(), "yaip-oss-pack-"))
const appDir = path.resolve("apps/oss")

execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
  cwd: appDir,
  stdio: "inherit",
})

const tarball = readdirSync(outDir).find((entry) => entry.endsWith(".tgz"))

if (!tarball) {
  throw new Error("expected pnpm pack to produce a tarball")
}

const entries = execFileSync("tar", ["-tzf", path.join(outDir, tarball)], {
  encoding: "utf8",
})
  .trim()
  .split("\n")

for (const requiredEntry of [
  "package/build/index.mjs",
  "package/build/resolve-app-paths.mjs",
  "package/src/routes/__root.tsx",
  "package/src/styles.css",
  "package/src/router.tsx",
  "package/src/routeTree.gen.ts",
  "package/prisma/schema.prisma",
  "package/generated/prisma/client.ts",
]) {
  if (!entries.includes(requiredEntry)) {
    throw new Error(`packed tarball is missing ${requiredEntry}`)
  }
}
