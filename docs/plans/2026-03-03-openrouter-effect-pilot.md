# OpenRouter Effect Pilot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Effect-based typed error handling to the OpenRouter boundary without changing broader app architecture.

**Architecture:** Keep tRPC/Zod/Prisma structure unchanged. Refactor `src/lib/ai/openrouter.ts` to run HTTP and parsing through Effect, define tagged domain errors, and keep function signatures stable for callers. Extend tests to validate error tags and messages for failure paths.

**Tech Stack:** TypeScript, Vitest, Effect, Zod, Fetch API.

---

### Task 1: Add failing tests for OpenRouter error taxonomy

**Files:**
- Modify: `src/lib/ai/__tests__/openrouter.test.ts`

1. Add tests that expect `generateInvoiceDraftWithOpenRouter` to reject with typed tagged errors for:
   - non-2xx response
   - empty model output
2. Add tests that expect `fetchOpenRouterModelIds` to reject with typed tagged errors for:
   - non-2xx response
   - malformed payload
3. Run targeted test command and confirm tests fail.

### Task 2: Introduce Effect-based request pipeline in openrouter module

**Files:**
- Modify: `src/lib/ai/openrouter.ts`
- Modify: `package.json` (dependency)
- Modify: `pnpm-lock.yaml`

1. Add `effect` dependency.
2. Add tagged error classes for network/http/parse/empty-output failures.
3. Implement shared Effect helpers for fetch, text/json decoding, and typed failures.
4. Keep public function signatures unchanged and return values equivalent on success.
5. Run targeted tests and confirm green.

### Task 3: Verify module behavior and guard against regressions

**Files:**
- Modify: `src/lib/ai/__tests__/openrouter.test.ts` (if needed)

1. Run full openrouter test file.
2. Run whole AI test folder.
3. Report evidence from command output before completion claim.
