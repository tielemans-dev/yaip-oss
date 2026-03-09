#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const appRoot = path.join(repoRoot, "apps/oss")
const sourceRoot = path.join(appRoot, "src")
const allowlistPath = path.join(repoRoot, "scripts/i18n/tm-allowlist.json")

function listSourceFiles(dirPath, output = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      listSourceFiles(fullPath, output)
      continue
    }
    if (!entry.isFile()) continue
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue
    output.push(fullPath)
  }
  return output
}

function countTmCallsInFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  const matches = source.match(/\btm\(/g)
  return matches?.length ?? 0
}

function fail(message) {
  console.error(`i18n tm-guard failed: ${message}`)
  process.exit(1)
}

if (!fs.existsSync(allowlistPath)) {
  fail(`Allowlist not found at ${allowlistPath}. Run scripts/update-tm-allowlist.mjs`)
}

const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"))
const files = listSourceFiles(sourceRoot)
const actual = {}

for (const fullPath of files) {
  const relativePath = path.relative(appRoot, fullPath).replaceAll(path.sep, "/")
  const count = countTmCallsInFile(fullPath)
  if (count > 0) {
    actual[relativePath] = count
  }
}

const violations = []
for (const [filePath, count] of Object.entries(actual)) {
  const allowed = allowlist[filePath] ?? 0
  if (count > allowed) {
    violations.push(`${filePath}: found ${count}, allowed ${allowed}`)
  }
}

if (violations.length > 0) {
  fail(`New inline tm(...) usage detected:\n${violations.join("\n")}`)
}

console.log(`i18n tm-guard ok. tracked files: ${Object.keys(actual).length}`)
