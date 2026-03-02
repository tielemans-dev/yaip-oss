# I18n Extensibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make translations easy to extend by moving to feature-sliced language catalogs and adding guardrails that prevent inline translation sprawl.

**Architecture:** Split `messages.ts` into per-language, per-feature catalog modules under `src/lib/i18n/catalog/`, then compose a typed root catalog from those modules. Keep backward-compatible exports for current imports. Add `i18n:check` to enforce catalog key parity and a `tm` allowlist guard to stop new inline translations while migration continues.

**Tech Stack:** TypeScript, Node.js scripts, existing i18n runtime.

---

### Task 1: Split catalogs into feature files
- Create per-feature files for `en` and `da` under `src/lib/i18n/catalog/{en,da}`.
- Create language indexes and root catalog index.
- Keep `messages.ts` as typed compatibility façade exporting `enMessages`, `daMessages`, `messageCatalog`, `TranslationKey`, `SupportedLanguage`.

### Task 2: Add parity guardrail
- Add `scripts/i18n-check.mjs` to validate key parity across language catalog files.
- Add npm script `i18n:check`.

### Task 3: Add inline-translation guardrail
- Add `scripts/i18n-tm-guard.mjs` to enforce no new `tm(...)` callsites outside allowlist.
- Generate baseline allowlist file and wire it into `i18n:check`.

### Task 4: Verification and commit
- Run `pnpm i18n:check`.
- Run `pnpm test` and `pnpm build`.
- Commit with a focused message.
