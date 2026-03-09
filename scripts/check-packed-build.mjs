import { execFileSync } from "node:child_process"
import { mkdtempSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const appDir = path.resolve("apps/oss")
const contractsDir = path.resolve("packages/contracts")
const sharedDir = path.resolve("packages/shared")

function packPackage(cwd, prefix) {
  const outDir = mkdtempSync(path.join(tmpdir(), prefix))

  execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
    cwd,
    stdio: "inherit",
  })

  const tarball = readdirSync(outDir).find((entry) => entry.endsWith(".tgz"))

  if (!tarball) {
    throw new Error(`expected pnpm pack to produce a tarball for ${cwd}`)
  }

  return path.join(outDir, tarball)
}

function listEntries(tarballPath) {
  return execFileSync("tar", ["-tzf", tarballPath], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
}

function readManifest(tarballPath) {
  return JSON.parse(
    execFileSync("tar", ["-xOf", tarballPath, "package/package.json"], {
      encoding: "utf8",
    })
  )
}

const appTarball = packPackage(appDir, "yaip-oss-pack-")
const appEntries = listEntries(appTarball)

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
  if (!appEntries.includes(requiredEntry)) {
    throw new Error(`packed tarball is missing ${requiredEntry}`)
  }
}

const contractsTarball = packPackage(contractsDir, "yaip-contracts-pack-")
const contractsEntries = listEntries(contractsTarball)

for (const requiredEntry of [
  "package/package.json",
  "package/src/index.ts",
  "package/src/baseSchemas.ts",
  "package/src/runtime.ts",
  "package/src/email.ts",
  "package/src/onboarding.ts",
  "package/src/payments.ts",
  "package/src/quotes.ts",
]) {
  if (!contractsEntries.includes(requiredEntry)) {
    throw new Error(`packed contracts tarball is missing ${requiredEntry}`)
  }
}

const appManifest = readManifest(appTarball)
const contractsManifest = readManifest(contractsTarball)
const sharedTarball = packPackage(sharedDir, "yaip-shared-pack-")
const sharedEntries = listEntries(sharedTarball)

for (const requiredEntry of [
  "package/package.json",
  "package/src/index.ts",
  "package/src/http.ts",
  "package/src/logging.ts",
  "package/src/runtimeEnv.ts",
]) {
  if (!sharedEntries.includes(requiredEntry)) {
    throw new Error(`packed shared tarball is missing ${requiredEntry}`)
  }
}

const sharedManifest = readManifest(sharedTarball)

if (appManifest.dependencies?.["@yaip/contracts"] !== contractsManifest.version) {
  throw new Error(
    `expected packed @yaip/oss dependency on @yaip/contracts to be ${contractsManifest.version}`
  )
}

if (appManifest.dependencies?.["@yaip/shared"] !== sharedManifest.version) {
  throw new Error(
    `expected packed @yaip/oss dependency on @yaip/shared to be ${sharedManifest.version}`
  )
}
