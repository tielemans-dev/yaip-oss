# T3code-Inspired Aggressive Adoption Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure YAIP into a workspace-based repository with stronger agent guidance, explicit contracts/shared packages, stricter quality gates, targeted Effect-based boundary hardening, browser smoke coverage, and structured observability.

**Architecture:** Keep YAIP's product runtime recognizable while splitting the repository into `apps/oss`, `packages/contracts`, `packages/shared`, and `scripts` under a pnpm workspace coordinated by Turbo. Preserve the public `@yaip/oss` export surface while extracting cross-cutting contracts and helpers, then harden selected integration boundaries and add targeted browser and observability infrastructure.

**Tech Stack:** pnpm workspaces, Turbo, TypeScript, TanStack Start, tRPC, Prisma, Better Auth, Effect, Zod, Vitest, Playwright, GitHub Actions.

---

### Task 1: Add Repo-Local Agent And Review Governance

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `.github/pull_request_template.md`
- Modify: `README.md`

**Step 1: Write the file-level governance additions**

Create:

- `AGENTS.md` with:
  - task completion requirements: `pnpm lint`, `pnpm typecheck`, `pnpm test`, targeted verification for browser tests when relevant
  - package-role descriptions for `apps/oss`, `packages/contracts`, `packages/shared`, `scripts`
  - core priorities: correctness, OSS/cloud boundary integrity, migration safety, maintainability
  - explicit note to preserve public export surface while moving internals
- `CLAUDE.md` with the same content as `AGENTS.md`
- `.github/pull_request_template.md` with sections:
  - `What Changed`
  - `Why`
  - `UI Changes`
  - checklist for focused scope and screenshots/video

**Step 2: Document the new contribution expectations**

Modify `README.md` to mention:

- repository-local agent instructions
- lint/typecheck expectations
- browser tests as part of quality gates once added

**Step 3: Verify the doc-only delta**

Run: `git diff -- AGENTS.md CLAUDE.md .github/pull_request_template.md README.md`
Expected: only documentation/governance changes appear

**Step 4: Commit**

```bash
git add AGENTS.md CLAUDE.md .github/pull_request_template.md README.md
git commit -m "docs: add repository governance and review templates"
```

### Task 2: Add Maintainability Index And Migration Tracking

**Files:**
- Create: `docs/plans/README.md`
- Modify: `docs/plans/2026-03-09-t3code-aggressive-adoption-design.md`

**Step 1: Create a concise maintainability index**

Add `docs/plans/README.md` listing active tracks:

- workspace split
- contracts extraction
- shared package extraction
- Effect boundary expansion
- browser coverage
- observability/logging
- CI and release verification

**Step 2: Link the aggressive adoption design from the index**

Add a reference entry for `docs/plans/2026-03-09-t3code-aggressive-adoption-design.md`.

**Step 3: Verify the new planning index**

Run: `sed -n '1,200p' docs/plans/README.md`
Expected: clear short index with the adoption program called out

**Step 4: Commit**

```bash
git add docs/plans/README.md docs/plans/2026-03-09-t3code-aggressive-adoption-design.md
git commit -m "docs: add maintainability planning index"
```

### Task 3: Add Root Quality Gates And Workspace Scaffolding

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/oss-boundary.yml`

**Step 1: Write failing command expectations as scripts**

Modify `package.json` to add:

- `lint`
- `typecheck`
- workspace-aware `build`
- workspace-aware `test`
- optional `test:e2e`

Initial target commands can still point at the current app until the move happens:

```json
{
  "scripts": {
    "lint": "oxlint --report-unused-disable-directives .",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test:unit": "vitest run -c vitest.config.ts",
    "test": "pnpm i18n:check && pnpm test:unit"
  }
}
```

**Step 2: Add workspace files with current repo as the first package**

Create:

- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`

The first version should target:

- `apps/*`
- `packages/*`
- `scripts`

and allow a temporary root package during migration.

**Step 3: Run the new gates and confirm at least one fails before follow-up fixes if configuration is incomplete**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: at least one command may fail initially if config or generated files need exemptions

**Step 4: Fix minimal config issues until both commands pass**

Typical fixes:

- generated file ignore patterns for lint
- shared compiler options moved to `tsconfig.base.json`
- script wiring corrections

**Step 5: Update CI to enforce the new gates**

Modify both workflows to include:

- install
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- existing build and boundary checks

**Step 6: Verify**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Expected: all exit `0`

**Step 7: Commit**

```bash
git add pnpm-workspace.yaml turbo.json tsconfig.base.json package.json tsconfig.json .github/workflows/ci.yml .github/workflows/oss-boundary.yml
git commit -m "build: add workspace quality gates and turbo scaffolding"
```

### Task 4: Move The App Into `apps/oss` While Preserving Behavior

**Files:**
- Create: `apps/oss/package.json`
- Create: `apps/oss/tsconfig.json`
- Create: `apps/oss/vite.config.ts`
- Create: `apps/oss/vitest.config.ts`
- Create: `apps/oss/prisma.config.ts`
- Create: `apps/oss/components.json`
- Create: `apps/oss/README.md`
- Move: `src/**` to `apps/oss/src/**`
- Move: `public/**` to `apps/oss/public/**`
- Move: `prisma/**` to `apps/oss/prisma/**`
- Move: `build/**` to `apps/oss/build/**`
- Move: `scripts/**` to `scripts/**` or `apps/oss/scripts/**` depending on ownership
- Modify: root `package.json`

**Step 1: Add the package shell before moving files**

Create `apps/oss/package.json` with the current app scripts and the same package name `@yaip/oss`.

**Step 2: Move one top-level directory at a time**

Move in this order:

1. `src`
2. `public`
3. `prisma`
4. `build`

After each move, update imports and config references before moving the next directory.

**Step 3: Keep the root package as orchestration-only**

Root `package.json` should stop exporting app files directly and instead orchestrate workspace tasks via Turbo/pnpm filters.

**Step 4: Verify the published surface remains stable**

Run:

```bash
pnpm --filter @yaip/oss build
pnpm --filter @yaip/oss test
node apps/oss/scripts/check-packed-build.mjs
```

Expected: build and test pass, artifact check still passes or is updated to its new location

**Step 5: Commit**

```bash
git add package.json apps/oss public src prisma build scripts
git commit -m "refactor: move oss app into workspace package"
```

### Task 5: Extract Shared Scripts Package Ownership

**Files:**
- Create: `scripts/package.json`
- Create: `scripts/tsconfig.json`
- Modify: moved script paths referenced by CI and package scripts
- Test: `scripts/__tests__/package-manager.test.ts`
- Test: `scripts/__tests__/predev-bootstrap-lib.test.ts`

**Step 1: Classify scripts by ownership**

Keep pure workspace automation in `scripts/`.
Keep app-specific runtime scripts under `apps/oss/scripts/` only if they directly depend on app-local files.

**Step 2: Add `scripts/package.json` for workspace-owned verification scripts**

Include:

- `typecheck`
- `test`

**Step 3: Update root and CI references**

Point commands such as `check-packed-build` and package-manager verification at the correct package/script location.

**Step 4: Verify script package tests**

Run:

```bash
pnpm --filter ./scripts test
```

Expected: script tests pass

**Step 5: Commit**

```bash
git add scripts package.json .github/workflows/ci.yml .github/workflows/oss-boundary.yml
git commit -m "build: define shared scripts package ownership"
```

### Task 6: Create `packages/contracts` For Shared Schemas And Branded IDs

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/baseSchemas.ts`
- Create: `packages/contracts/src/runtime.ts`
- Create: `packages/contracts/src/payments.ts`
- Create: `packages/contracts/src/email.ts`
- Create: `packages/contracts/src/onboarding.ts`
- Modify: `apps/oss/src/lib/runtime/extensions.ts`
- Modify: selected imports in `apps/oss/src/trpc/**` and `apps/oss/src/lib/**`

**Step 1: Start with low-risk contract extraction**

Implement branded IDs and schemas only for:

- runtime capabilities
- payment/public session DTOs
- email delivery state
- onboarding AI/public onboarding DTOs

**Step 2: Keep contracts schema-only**

No fetch logic, DB logic, or router logic in this package.

**Step 3: Migrate one boundary consumer at a time**

Replace local duplicate types in:

- `apps/oss/src/lib/runtime/extensions.ts`
- payment/public session modules
- email delivery modules
- onboarding AI contract modules

**Step 4: Add focused tests if extraction changes behavior**

If contract parsing logic is introduced, add tests under `packages/contracts/src/*.test.ts`.

**Step 5: Verify**

Run:

```bash
pnpm --filter @yaip/oss test
pnpm --filter ./packages/contracts typecheck
```

Expected: both pass

**Step 6: Commit**

```bash
git add packages/contracts apps/oss/src/lib apps/oss/src/trpc
git commit -m "refactor: extract shared contracts package"
```

### Task 7: Create `packages/shared` For Explicit Runtime Utilities

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts` only if needed for tests, otherwise omit
- Create: `packages/shared/src/logging.ts`
- Create: `packages/shared/src/runtimeEnv.ts`
- Create: `packages/shared/src/http.ts`
- Modify: imports in `apps/oss/src/lib/**`

**Step 1: Extract only clearly shared utilities**

Start with:

- logging helpers
- env normalization helpers
- HTTP helpers used by Effect boundaries

Use explicit subpath exports like:

```json
{
  "exports": {
    "./logging": "./src/logging.ts",
    "./runtime-env": "./src/runtimeEnv.ts",
    "./http": "./src/http.ts"
  }
}
```

**Step 2: Remove duplicate helper logic from app-local files**

Update app imports to use the shared package rather than copied local helpers.

**Step 3: Verify**

Run:

```bash
pnpm --filter ./packages/shared typecheck
pnpm --filter @yaip/oss test
```

Expected: both pass

**Step 4: Commit**

```bash
git add packages/shared apps/oss/src/lib
git commit -m "refactor: extract shared runtime utilities"
```

### Task 8: Expand Effect To Email And Payment Boundaries

**Files:**
- Modify: `apps/oss/src/lib/email.ts`
- Modify: `apps/oss/src/lib/email-delivery.ts`
- Modify: `apps/oss/src/lib/document-email-sending.ts`
- Modify: `apps/oss/src/lib/payments/stripe.ts`
- Modify: `apps/oss/src/lib/payments/public-checkout.ts`
- Modify: `apps/oss/src/lib/payments/public-session.ts`
- Test: existing tests under `apps/oss/src/lib/__tests__/**`

**Step 1: Write or extend failing tests for tagged failures**

Cover:

- provider/network failure
- malformed payload failure
- non-2xx HTTP failure
- missing required response fields

Use existing Vitest files where possible.

**Step 2: Confirm the new tests fail**

Run targeted tests such as:

```bash
pnpm exec vitest run apps/oss/src/lib/__tests__/email-delivery.test.ts apps/oss/src/lib/__tests__/stripe-config.test.ts
```

Expected: new assertions fail before implementation

**Step 3: Introduce minimal Effect pipelines and tagged errors**

Keep public function signatures stable for callers. Use Effect internally for:

- fetch/wrapper helpers
- response decoding
- typed failure mapping

**Step 4: Verify targeted and broader suites**

Run:

```bash
pnpm exec vitest run apps/oss/src/lib/__tests__/email-delivery.test.ts apps/oss/src/lib/__tests__/document-email-sending.test.ts apps/oss/src/lib/__tests__/stripe-config.test.ts apps/oss/src/lib/__tests__/stripe-webhooks.test.ts
```

Expected: pass

**Step 5: Commit**

```bash
git add apps/oss/src/lib
git commit -m "refactor: harden email and payment boundaries with effect"
```

### Task 9: Expand Effect To Onboarding AI And Public Access Boundaries

**Files:**
- Modify: `apps/oss/src/lib/onboarding/ai-contract.ts`
- Modify: `apps/oss/src/lib/onboarding/ai-fallback.ts`
- Modify: `apps/oss/src/lib/cloud-onboarding.ts`
- Modify: `apps/oss/src/lib/quotes/public-session.ts`
- Modify: `apps/oss/src/lib/quotes/public-access.ts`
- Test: related files in `apps/oss/src/lib/__tests__/**` and `apps/oss/src/trpc/routers/__tests__/**`

**Step 1: Add failing tests where current errors are too loose**

Focus on:

- malformed AI provider output
- disabled-capability edge cases
- invalid public token/session payload handling

**Step 2: Verify red state**

Run targeted tests for the changed files and confirm failures.

**Step 3: Implement Effect-based boundary handling**

Keep routers and route handlers simple by returning app-native errors after the internal Effect pipeline settles.

**Step 4: Verify**

Run:

```bash
pnpm exec vitest run apps/oss/src/lib/ai/__tests__/openrouter.test.ts apps/oss/src/lib/__tests__/cloud-onboarding.test.ts apps/oss/src/lib/__tests__/quote-public-state.test.ts apps/oss/src/lib/__tests__/quote-public-url.test.ts
```

Expected: pass

**Step 5: Commit**

```bash
git add apps/oss/src/lib apps/oss/src/trpc
git commit -m "refactor: harden onboarding and public access boundaries"
```

### Task 10: Add Structured Observability For High-Risk Workflows

**Files:**
- Create: `packages/shared/src/structuredLogging.ts`
- Modify: `apps/oss/src/lib/email-delivery.ts`
- Modify: `apps/oss/src/lib/document-email-sending.ts`
- Modify: `apps/oss/src/lib/payments/public-checkout.ts`
- Modify: `apps/oss/src/lib/payments/webhooks.ts`
- Modify: `apps/oss/src/lib/cloud-onboarding.ts`
- Create: `apps/oss/src/lib/__tests__/structured-logging.test.ts` if needed

**Step 1: Define a minimal JSONL logger contract**

Support:

- event name
- level
- timestamp
- correlation/request/workflow id where available
- sanitized payload fields

**Step 2: Integrate additive logging only**

Do not change return values or control flow except where necessary to surface log context.

**Step 3: Add focused tests for emitted shape if the logger is programmatically consumed**

If logs are pure side effects, prefer unit tests around formatter/helper functions.

**Step 4: Verify**

Run:

```bash
pnpm exec vitest run apps/oss/src/lib/__tests__/email-delivery.test.ts apps/oss/src/lib/__tests__/document-email-sending-sync.test.ts apps/oss/src/lib/__tests__/cloud-onboarding.test.ts
```

Expected: pass

**Step 5: Commit**

```bash
git add packages/shared apps/oss/src/lib
git commit -m "feat: add structured observability for critical workflows"
```

### Task 11: Add Browser Smoke Coverage With Playwright

**Files:**
- Create: `apps/oss/playwright.config.ts`
- Create: `apps/oss/tests/e2e/setup.spec.ts`
- Create: `apps/oss/tests/e2e/login.spec.ts`
- Create: `apps/oss/tests/e2e/public-quote.spec.ts`
- Create: `apps/oss/tests/e2e/public-invoice-payment.spec.ts`
- Create: `apps/oss/tests/e2e/document-email-sending.spec.ts`
- Modify: `apps/oss/package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

**Step 1: Add Playwright dependency and scripts**

Add:

- `playwright`
- `@playwright/test`
- `test:e2e`

**Step 2: Write the first failing smoke test only**

Start with one path, for example setup or login, and confirm it fails before building more tests.

**Step 3: Add minimal test fixtures/helpers**

Use app bootstrap helpers and env assumptions instead of overbuilding a test framework.

**Step 4: Expand to the four remaining critical flows**

Keep each test short and happy-path focused.

**Step 5: Wire CI**

Add a separate browser test job or a clearly named step with Playwright install and execution.

**Step 6: Verify locally**

Run:

```bash
pnpm --filter @yaip/oss test:e2e
```

Expected: all smoke tests pass

**Step 7: Commit**

```bash
git add apps/oss/package.json apps/oss/playwright.config.ts apps/oss/tests/e2e .github/workflows/ci.yml README.md
git commit -m "test: add browser smoke coverage for critical flows"
```

### Task 12: Finalize Workspace CI, Build, And Release Verification

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/oss-boundary.yml`
- Modify: `.github/workflows/publish-package.yml`
- Modify: `scripts/check-packed-build.mjs` or moved equivalent
- Modify: `README.md`

**Step 1: Update all workflow paths and commands to workspace-aware invocations**

Ensure jobs call the right package with filters rather than relying on old root-relative app structure.

**Step 2: Verify release/package checks still assert the intended exported artifact**

If the artifact path changed due to `apps/oss`, update the verification script accordingly and add assertions for the preserved public exports.

**Step 3: Run the full local verification set**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @yaip/oss build
pnpm --filter @yaip/oss test:e2e
```

Expected: all commands exit `0`

**Step 4: Commit**

```bash
git add .github/workflows README.md scripts apps/oss/package.json
git commit -m "ci: finalize workspace verification and release checks"
```

### Task 13: End-To-End Migration Review

**Files:**
- Review all changed files
- Update docs if gaps remain

**Step 1: Diff review**

Run:

```bash
git status --short
git diff --stat
```

Expected: no unintended files outside the migration scope

**Step 2: Re-run the full verification suite**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @yaip/oss build
pnpm --filter @yaip/oss test:e2e
```

Expected: all exit `0`

**Step 3: Write a short migration summary into docs if needed**

If the final repo shape differs materially from the design, update:

- `README.md`
- `docs/plans/README.md`
- `docs/plans/2026-03-09-t3code-aggressive-adoption-design.md`

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: finalize t3code-inspired workspace adoption"
```
