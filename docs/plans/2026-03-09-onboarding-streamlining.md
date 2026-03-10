# Onboarding Streamlining Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat cloud onboarding form with an adaptive flow that prefills localized defaults, asks users to confirm them, and only shows tax/compliance fields when they are relevant.

**Architecture:** Introduce a shared onboarding rule layer that derives defaults, field visibility, and requirement state from `countryCode`, `taxRegime`, and a persisted onboarding invoicing identity. Reuse that rule layer across contracts, readiness evaluation, the onboarding route, AI onboarding helpers, and the settings tax section so the UI and server return the same answer about which fields matter.

**Tech Stack:** Prisma, PostgreSQL migrations, TanStack Start, TanStack Router, React 19, tRPC, TypeScript, Vitest, Testing Library, Playwright, pnpm

---

### Task 1: Add a shared onboarding rules engine behind failing tests

**Files:**
- Create: `apps/oss/src/lib/onboarding/rules.ts`
- Create: `apps/oss/src/lib/__tests__/onboarding-rules.test.ts`
- Modify: `apps/oss/src/lib/onboarding/readiness.ts`
- Modify: `apps/oss/src/lib/__tests__/onboarding-readiness.test.ts`
- Modify: `apps/oss/src/lib/onboarding/ai-contract.ts`

**Step 1: Write the failing test**

Add `apps/oss/src/lib/__tests__/onboarding-rules.test.ts` with cases that prove:

- `DK` + `registered_business` suggests `da-DK`, `Europe/Copenhagen`, `DKK`, and `eu_vat`
- `DK` + `individual` suggests Danish locale defaults but keeps `primaryTaxId` hidden and not required
- `US` defaults suggest `en-US`, `USD`, and `us_sales_tax`
- the rules helper returns visibility and requirement state for `primaryTaxId`

Extend `apps/oss/src/lib/__tests__/onboarding-readiness.test.ts` so readiness only reports `primaryTaxId` missing when the shared rules mark it required.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @yaip/oss test -- src/lib/__tests__/onboarding-rules.test.ts src/lib/__tests__/onboarding-readiness.test.ts
```

Expected: FAIL because there is no shared rules module yet and readiness still keys off `taxRegime === "eu_vat"` directly.

**Step 3: Write minimal implementation**

Implement `apps/oss/src/lib/onboarding/rules.ts` with a single exported helper that returns:

- suggested defaults for locale, timezone, currency, and tax regime
- `showPrimaryTaxId`
- `requirePrimaryTaxId`
- optional country-aware label/help metadata for later UI use

Update `apps/oss/src/lib/onboarding/readiness.ts` and `apps/oss/src/lib/onboarding/ai-contract.ts` to consume that helper instead of duplicating requirement logic.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @yaip/oss test -- src/lib/__tests__/onboarding-rules.test.ts src/lib/__tests__/onboarding-readiness.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/oss/src/lib/onboarding/rules.ts apps/oss/src/lib/__tests__/onboarding-rules.test.ts apps/oss/src/lib/onboarding/readiness.ts apps/oss/src/lib/__tests__/onboarding-readiness.test.ts apps/oss/src/lib/onboarding/ai-contract.ts
git commit -m "feat: add shared onboarding relevance rules"
```

### Task 2: Persist onboarding invoicing identity in contracts and router state

**Files:**
- Modify: `packages/contracts/src/onboarding.ts`
- Modify: `packages/contracts/src/onboarding.test.ts`
- Modify: `apps/oss/prisma/schema.prisma`
- Create: `apps/oss/prisma/migrations/20260309xxxxxx_add_onboarding_invoicing_identity/migration.sql`
- Modify: `apps/oss/src/trpc/routers/onboarding.ts`
- Modify: `apps/oss/src/trpc/routers/onboarding-ai.ts`
- Modify: `apps/oss/src/lib/cloud-onboarding.ts`
- Modify: `apps/oss/src/lib/cloud-onboarding-session.ts`
- Modify: `apps/oss/src/lib/onboarding/guard.ts`
- Modify: `apps/oss/src/trpc/routers/__tests__/onboarding.integration.test.ts`

**Step 1: Write the failing test**

Add contract tests that accept a new onboarding field such as `invoicingIdentity` with values `individual` and `registered_business`.

Extend `apps/oss/src/trpc/routers/__tests__/onboarding.integration.test.ts` so the saved draft/status round-trip includes `invoicingIdentity`, and completion requires `primaryTaxId` for `DK` + `registered_business` + `eu_vat` but not for `DK` + `individual`.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @yaip/contracts test -- src/onboarding.test.ts
pnpm --filter @yaip/oss test -- src/trpc/routers/__tests__/onboarding.integration.test.ts
```

Expected: FAIL because contracts, Prisma, and router snapshots do not yet support the new field.

**Step 3: Write minimal implementation**

Update the contracts package to include `invoicingIdentity` in onboarding patch/value schemas.

Add a nullable `onboardingInvoicingIdentity` column to `OrgSettings`, then thread it through:

- onboarding status snapshots
- `saveDraft`
- AI onboarding patch application
- cloud onboarding session/guard reads

Use the shared rules helper when computing missing fields so hidden fields are never surfaced as missing.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @yaip/contracts test -- src/onboarding.test.ts
pnpm --filter @yaip/oss test -- src/trpc/routers/__tests__/onboarding.integration.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/contracts/src/onboarding.ts packages/contracts/src/onboarding.test.ts apps/oss/prisma/schema.prisma apps/oss/prisma/migrations apps/oss/src/trpc/routers/onboarding.ts apps/oss/src/trpc/routers/onboarding-ai.ts apps/oss/src/lib/cloud-onboarding.ts apps/oss/src/lib/cloud-onboarding-session.ts apps/oss/src/lib/onboarding/guard.ts apps/oss/src/trpc/routers/__tests__/onboarding.integration.test.ts
git commit -m "feat: persist onboarding invoicing identity"
```

### Task 3: Rebuild the onboarding page as an adaptive confirmation flow

**Files:**
- Modify: `apps/oss/src/routes/_app/onboarding.tsx`
- Create: `apps/oss/src/routes/__tests__/-onboarding-page-cloud-flow.test.tsx`
- Modify: `apps/oss/src/routes/__tests__/-onboarding-layout.test.ts`
- Modify: `apps/oss/src/lib/compliance/countries.ts`
- Modify: `apps/oss/src/lib/onboarding/ai-fallback.ts`
- Modify: `apps/oss/src/lib/i18n/catalog/en/auth.ts`
- Modify: `apps/oss/src/lib/i18n/catalog/da/auth.ts`

**Step 1: Write the failing test**

Add a route test that renders the cloud onboarding page and proves:

- choosing `DK` updates locale/currency/timezone defaults automatically
- the page asks the user to confirm those defaults rather than hiding them
- selecting `individual` hides the primary tax ID field
- selecting `registered_business` plus `eu_vat` reveals the primary tax ID field
- invoice/quote prefixes render inside an advanced defaults section rather than the primary onboarding block

Update the layout smoke test only for any new stable structural assertions that matter.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @yaip/oss test -- src/routes/__tests__/-onboarding-page-cloud-flow.test.tsx src/routes/__tests__/-onboarding-layout.test.ts
```

Expected: FAIL because the current page renders a flat form with always-visible tax controls and no adaptive steps.

**Step 3: Write minimal implementation**

Refactor `apps/oss/src/routes/_app/onboarding.tsx` to:

- add `invoicingIdentity` to client state
- derive suggested defaults and field visibility from the shared rules helper
- group the page into clear sections: basics, confirm defaults, relevant compliance details, advanced defaults
- update country changes to prefill locale/currency/timezone/tax regime when the user has not manually overridden them
- keep manual editability for all surfaced defaults

Update `apps/oss/src/lib/onboarding/ai-fallback.ts` so AI suggestions use the same country defaults and do not ask for irrelevant tax IDs.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @yaip/oss test -- src/routes/__tests__/-onboarding-page-cloud-flow.test.tsx src/routes/__tests__/-onboarding-layout.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/oss/src/routes/_app/onboarding.tsx apps/oss/src/routes/__tests__/-onboarding-page-cloud-flow.test.tsx apps/oss/src/routes/__tests__/-onboarding-layout.test.ts apps/oss/src/lib/compliance/countries.ts apps/oss/src/lib/onboarding/ai-fallback.ts apps/oss/src/lib/i18n/catalog/en/auth.ts apps/oss/src/lib/i18n/catalog/da/auth.ts
git commit -m "feat: streamline cloud onboarding flow"
```

### Task 4: Align the settings tax section with the same relevance rules

**Files:**
- Modify: `apps/oss/src/routes/_app/settings.tsx`
- Create: `apps/oss/src/routes/__tests__/-settings-tax-relevance.test.tsx`
- Modify: `apps/oss/src/lib/i18n/catalog/en/settings.ts`
- Modify: `apps/oss/src/lib/i18n/catalog/da/settings.ts`

**Step 1: Write the failing test**

Add a settings route test that proves:

- changing the country updates the displayed tax label/help copy
- irrelevant tax ID inputs are hidden or visually de-emphasized for combinations that do not require them
- `DK` + `registered_business` + `eu_vat` surfaces the tax ID input with Danish-oriented wording

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @yaip/oss test -- src/routes/__tests__/-settings-tax-relevance.test.tsx
```

Expected: FAIL because the settings page currently shows a generic tax ID section unconditionally.

**Step 3: Write minimal implementation**

Refactor the localization/tax card in `apps/oss/src/routes/_app/settings.tsx` to consume the shared rules helper and reuse the same labels/help content strategy as onboarding.

Keep the settings page more comprehensive than onboarding, but make relevance obvious and remove US-default wording for non-US users.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @yaip/oss test -- src/routes/__tests__/-settings-tax-relevance.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/oss/src/routes/_app/settings.tsx apps/oss/src/routes/__tests__/-settings-tax-relevance.test.tsx apps/oss/src/lib/i18n/catalog/en/settings.ts apps/oss/src/lib/i18n/catalog/da/settings.ts
git commit -m "feat: align settings tax relevance with onboarding"
```

### Task 5: Add targeted browser coverage for the onboarding flow

**Files:**
- Modify: `apps/oss/tests/e2e/login.spec.ts`
- Modify: `apps/oss/tests/e2e/support.ts`

**Step 1: Write the failing test**

Extend the signup/onboarding Playwright coverage so a cloud onboarding scenario verifies:

- signup lands on `/onboarding`
- selecting Denmark prefills Danish defaults
- selecting the individual path does not show the primary tax ID field
- switching to registered business plus EU VAT reveals the primary tax ID field

If existing support helpers assume self-host onboarding only, adjust them minimally to seed a cloud-ready runtime for this scenario.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @yaip/oss test:e2e -- tests/e2e/login.spec.ts
```

Expected: FAIL because the current onboarding UI is flat and does not adapt its field visibility.

**Step 3: Write minimal implementation**

Update the Playwright test and any setup helpers needed to exercise the cloud onboarding flow after the UI refactor.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @yaip/oss test:e2e -- tests/e2e/login.spec.ts
```

Expected: PASS

### Task 6: Run full verification before completion

**Files:**
- Test: `packages/contracts/src/onboarding.test.ts`
- Test: `apps/oss/src/lib/__tests__/onboarding-rules.test.ts`
- Test: `apps/oss/src/lib/__tests__/onboarding-readiness.test.ts`
- Test: `apps/oss/src/trpc/routers/__tests__/onboarding.integration.test.ts`
- Test: `apps/oss/src/routes/__tests__/-onboarding-page-cloud-flow.test.tsx`
- Test: `apps/oss/src/routes/__tests__/-settings-tax-relevance.test.tsx`
- Test: `apps/oss/tests/e2e/login.spec.ts`

**Step 1: Run focused verification**

Run:

```bash
pnpm --filter @yaip/contracts test -- src/onboarding.test.ts
pnpm --filter @yaip/oss test -- src/lib/__tests__/onboarding-rules.test.ts src/lib/__tests__/onboarding-readiness.test.ts src/trpc/routers/__tests__/onboarding.integration.test.ts src/routes/__tests__/-onboarding-page-cloud-flow.test.tsx src/routes/__tests__/-settings-tax-relevance.test.tsx
pnpm --filter @yaip/oss test:e2e -- tests/e2e/login.spec.ts
```

Expected: PASS

**Step 2: Run required repository verification**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Expected: PASS

Use `pnpm typecheck:app` as the fallback app check only if `pnpm typecheck` is blocked by unrelated legacy app issues discovered during execution.

**Step 3: Run final diff sanity checks**

Run:

```bash
git diff --check
git status --short
```

Expected: PASS with only intended file changes

**Step 4: Commit**

```bash
git add .
git commit -m "feat: streamline adaptive organization onboarding"
```

## Notes for the implementing agent

- Follow `@superpowers/test-driven-development` strictly for each task.
- Use `@superpowers/verification-before-completion` before claiming success.
- Keep OSS/cloud boundaries intact: the adaptive flow is cloud onboarding behavior, but shared rule helpers should stay distribution-agnostic where possible.
