#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const sourceRoot = path.resolve("src")
const outputPath = path.resolve("scripts/i18n/tm-allowlist.json")

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

const output = {}
for (const fullPath of listSourceFiles(sourceRoot)) {
  const relativePath = path.relative(process.cwd(), fullPath).replaceAll(path.sep, "/")
  const count = countTmCallsInFile(fullPath)
  if (count > 0) {
    output[relativePath] = count
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Updated ${outputPath} with ${Object.keys(output).length} files.`)
