# Navigation Performance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce navigation latency by deferring non-critical settings work, removing an extra invoices list round trip, and lazy-loading invoice PDF generation.

**Architecture:** Keep the current route structure and primary data fetches intact, but remove avoidable work from initial page entry. Defer settings-side secondary fetches, simplify the invoices list load path, and split the PDF generator out of the invoice detail initial bundle.

**Tech Stack:** TanStack Start, TanStack Router, tRPC, React 19, TypeScript, Vitest, Testing Library, pnpm

---

### Task 1: Add failing tests for deferred settings requests

**Files:**
- Create: `src/routes/__tests__/settings-performance.test.tsx`
- Modify: `src/routes/_app/settings.tsx`

**Step 1: Write the failing test**

Add a test that renders the settings route and proves:

- `trpc.settings.get.query()` is called on mount
- `trpc.ai.listModels.query()` is not called on mount
- `authClient.organization.getFullOrganization()` is not called on mount

**Step 2: Run test to verify it fails**

Run: `pnpm test src/routes/__tests__/settings-performance.test.tsx`

Expected: FAIL because the current page eagerly loads AI models and team data.

**Step 3: Write minimal implementation**

Update `src/routes/_app/settings.tsx` so:

- the AI models request is user-triggered instead of mount-triggered
- the team request is user-triggered instead of mount-triggered

Keep the existing settings fetch behavior unchanged.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/routes/__tests__/settings-performance.test.tsx`

Expected: PASS

### Task 2: Add failing test for invoices index load path

**Files:**
- Create: `src/routes/__tests__/invoices-index-performance.test.tsx`
- Modify: `src/routes/_app/invoices/index.tsx`

**Step 1: Write the failing test**

Add a test that renders the invoices index route and proves initial load only calls `trpc.invoices.list.query()` and does not call `trpc.invoices.markOverdue.mutate()`.

**Step 2: Run test to verify it fails**

Run: `pnpm test src/routes/__tests__/invoices-index-performance.test.tsx`

Expected: FAIL because the current page calls `markOverdue` before listing invoices.

**Step 3: Write minimal implementation**

Update `src/routes/_app/invoices/index.tsx` so the initial load path only fetches the list.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/routes/__tests__/invoices-index-performance.test.tsx`

Expected: PASS

### Task 3: Add failing test for invoice PDF lazy loading

**Files:**
- Create: `src/routes/__tests__/invoice-detail-performance.test.tsx`
- Modify: `src/routes/_app/invoices/$invoiceId.tsx`

**Step 1: Write the failing test**

Add a test that imports the invoice detail route module and asserts the PDF module is not imported during initial render.

The test should verify:

- the invoice detail page can render with mocked invoice/settings data
- the PDF helper module is not loaded during initial render

**Step 2: Run test to verify it fails**

Run: `pnpm test src/routes/__tests__/invoice-detail-performance.test.tsx`

Expected: FAIL because the route currently imports `downloadInvoicePdf` eagerly.

**Step 3: Write minimal implementation**

Update `src/routes/_app/invoices/$invoiceId.tsx` to load the PDF helper with a dynamic `import()` inside the download action.

**Step 4: Run test to verify it passes**

Run: `pnpm test src/routes/__tests__/invoice-detail-performance.test.tsx`

Expected: PASS

### Task 4: Run focused and broader verification

**Files:**
- Test: `src/routes/__tests__/settings-performance.test.tsx`
- Test: `src/routes/__tests__/invoices-index-performance.test.tsx`
- Test: `src/routes/__tests__/invoice-detail-performance.test.tsx`

**Step 1: Run focused route tests**

Run:

```bash
pnpm test src/routes/__tests__/settings-performance.test.tsx src/routes/__tests__/invoices-index-performance.test.tsx src/routes/__tests__/invoice-detail-performance.test.tsx
```

Expected: PASS

**Step 2: Run the relevant broader suite**

Run:

```bash
pnpm test
```

Expected: PASS

**Step 3: Run final diff sanity checks**

Run:

```bash
git diff --check
git status --short
```

Expected: PASS with only intended file changes
