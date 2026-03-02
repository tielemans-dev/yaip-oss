#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const catalogRoot = path.resolve("src/lib/i18n/catalog")

function listLanguageDirs() {
  return fs
    .readdirSync(catalogRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

function listCatalogFiles(language) {
  const languageDir = path.join(catalogRoot, language)
  return fs
    .readdirSync(languageDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && entry.name !== "index.ts")
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

function extractKeysFromFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  const keys = []
  const keyRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g
  let match
  while ((match = keyRegex.exec(source))) {
    keys.push(match[1])
  }
  return keys
}

function collectLanguageKeys(language) {
  const files = listCatalogFiles(language)
  const keys = new Set()
  const duplicates = new Set()

  for (const fileName of files) {
    const filePath = path.join(catalogRoot, language, fileName)
    for (const key of extractKeysFromFile(filePath)) {
      if (keys.has(key)) duplicates.add(key)
      keys.add(key)
    }
  }

  return { files, keys, duplicates }
}

function fail(message) {
  console.error(`i18n:check failed: ${message}`)
  process.exit(1)
}

if (!fs.existsSync(catalogRoot)) {
  fail(`Catalog directory not found at ${catalogRoot}`)
}

const languages = listLanguageDirs()
if (languages.length === 0) {
  fail("No language catalogs found")
}
if (!languages.includes("en")) {
  fail("Missing required base language catalog: en")
}

const reports = new Map()
for (const language of languages) {
  reports.set(language, collectLanguageKeys(language))
}

for (const [language, report] of reports.entries()) {
  if (report.files.length === 0) {
    fail(`Language '${language}' has no catalog files`)
  }
  if (report.duplicates.size > 0) {
    fail(`Language '${language}' has duplicate keys: ${Array.from(report.duplicates).slice(0, 10).join(", ")}`)
  }
}

const baseKeys = reports.get("en").keys

for (const [language, report] of reports.entries()) {
  if (language === "en") continue

  const missing = []
  const extra = []

  for (const key of baseKeys) {
    if (!report.keys.has(key)) missing.push(key)
  }
  for (const key of report.keys) {
    if (!baseKeys.has(key)) extra.push(key)
  }

  if (missing.length > 0 || extra.length > 0) {
    const missingPreview = missing.slice(0, 10).join(", ")
    const extraPreview = extra.slice(0, 10).join(", ")
    fail(
      `Language '${language}' key mismatch. Missing (${missing.length}): [${missingPreview}] Extra (${extra.length}): [${extraPreview}]`
    )
  }
}

console.log(`i18n:check ok. Languages: ${languages.join(", ")}. Keys: ${baseKeys.size}.`)
