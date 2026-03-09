# T3code-Inspired Aggressive Adoption Design

## Summary

Adopt the strongest relevant practices observed in `pingdotgg/t3code` while preserving YAIP's product architecture and deployment model. This is an aggressive upgrade program that introduces:

- repository-local agent instructions
- stronger local and CI quality gates
- a pnpm workspace split with Turbo orchestration
- explicit contracts and shared runtime packages
- broader Effect-based boundary handling
- browser smoke/E2E coverage
- structured application observability for high-risk workflows

This is not a Bun migration and not a rewrite of YAIP into an event-sourced agent runtime.

## Goals

- Make agentic coding behavior more consistent inside this repository.
- Reduce review ambiguity with clearer repo instructions and PR requirements.
- Strengthen correctness gates beyond tests alone.
- Restructure the repository to make boundaries explicit and support future private/cloud composition.
- Harden remote and failure-prone integrations with typed contracts and typed failures.
- Add runtime visibility for debugging payment, onboarding, email, and public access issues.

## Non-Goals

- Replace TanStack Start, tRPC, Prisma, Better Auth, or Tailwind.
- Switch package manager from pnpm to Bun.
- Introduce full event sourcing across the app.
- Replace all Zod validation with Effect Schema.
- Rebuild all existing features while moving files.

## Proposed Architecture

### Repo Topology

Move the repository to a pnpm workspace with Turbo orchestration:

- `apps/oss`
  - primary application package
  - contains TanStack Start app, routes, UI, Prisma-facing runtime code, and the published artifact surface for `@yaip/oss`
- `packages/contracts`
  - shared contracts, branded IDs, capability schemas, DTOs, and boundary types
  - no application runtime logic
- `packages/shared`
  - shared runtime utilities and helpers
  - explicit subpath exports only
- `scripts`
  - workspace-owned automation, guardrails, and verification scripts
- repository root
  - `turbo.json`
  - `pnpm-workspace.yaml`
  - `AGENTS.md`
  - `CLAUDE.md`
  - PR template
  - CI workflows
  - maintainability and implementation planning docs

### Package Strategy

Keep the published export surface stable while moving implementation details behind the workspace split. The migration should preserve current external consumers of `@yaip/oss` and avoid unnecessary API churn.

### Task Orchestration

Use Turbo for `build`, `typecheck`, `lint`, `test`, and selected E2E/smoke tasks. Keep pnpm as package manager to avoid unnecessary operational churn in YAIP.

## Behavioral Improvements

### Agentic Coding Governance

Add repository-local `AGENTS.md` and `CLAUDE.md` to define:

- completion gates
- architectural boundaries
- package roles
- review expectations
- preferred commands
- quality priorities

These should be tuned to YAIP rather than copied verbatim from `t3code`.

### Review Discipline

Add a PR template that requires:

- clear change summary
- rationale
- screenshots for UI changes
- video for motion-heavy changes
- confirmation that the change is small and focused

### Maintainability Planning

Create a concise maintainability index so architectural work does not disappear into dated plan files. This complements existing `docs/plans` documents instead of replacing them.

## Contracts And Boundaries

### `packages/contracts`

Extract shared contracts for the highest-value boundaries first:

- runtime capability data
- onboarding AI request and result shapes
- payment/public session DTOs
- email delivery state DTOs
- branded identifiers for high-value entities where they cross package boundaries

The contracts package should focus on schema and type ownership, not runtime behavior.

### `packages/shared`

Extract reusable utilities with explicit subpath exports. Avoid a broad barrel export that obscures ownership or encourages incidental coupling.

## Effect Adoption Strategy

Expand Effect usage at remote and failure-prone boundaries only:

- OpenRouter and AI boundaries
- email delivery provider interactions
- Stripe checkout/session/webhook boundaries
- selected public document/payment access flows

Keep existing Zod, tRPC, and application structure where they are already a good fit. The goal is better typed failures and narrower parsing boundaries, not ideological replacement.

## Testing Strategy

### Quality Gates

Add local and CI gates for:

- lint
- typecheck
- existing unit/integration tests
- build verification
- package/export verification

### Browser Coverage

Add Playwright for targeted browser coverage on high-risk flows:

- installation/setup
- login/signup happy path
- quote public access and acceptance
- invoice public payment page
- settings/document email sending

Keep this suite intentionally small at first so CI remains usable.

## Observability Strategy

Add structured JSONL logging for high-risk workflows:

- email delivery
- payment/public checkout flows
- onboarding AI actions
- selected public document access events

Logs should be:

- request or workflow correlated where practical
- safe for OSS/self-host usage
- useful for production debugging
- additive rather than architecture-defining

This is a targeted observability layer, not a full event log or generalized event-sourcing system.

## CI And Developer Experience

Update CI to include:

- workspace-aware install/build/test flow
- lint and typecheck enforcement
- targeted browser test job
- existing OSS boundary checks
- package/export artifact checks after workspace migration

Add local scripts so contributors can run the same quality gates without reconstructing CI logic manually.

## Risks

- workspace migration could break packaging or published exports
- Turbo adoption could introduce task/config drift if added too early without stable task definitions
- contracts could become over-abstracted before real package seams settle
- Effect adoption could spread too broadly and increase incidental complexity
- browser tests could become flaky if initial scope is too ambitious

## Risk Controls

- preserve the current public export surface while moving internals
- migrate the workspace structure before broad contract extraction
- move one domain at a time for contract and Effect adoption
- keep Playwright coverage focused on a few high-value happy paths initially
- verify each phase with targeted commands plus full build/test evidence

## Recommended Delivery Order

1. Repo governance and quality-gate foundation
2. Workspace split with stable published surface
3. Contracts/shared package extraction
4. Effect boundary expansion
5. Browser coverage and structured observability

## Success Criteria

- contributors and coding agents have repo-local instructions and enforceable completion gates
- lint, typecheck, tests, build, and boundary checks all run in CI
- repository is organized into workspace packages with clearer ownership
- key external boundaries expose stronger typed contracts
- high-risk integrations use typed failure handling
- YAIP has at least a minimal browser smoke layer for critical user flows
- production debugging for payments, onboarding, and email failures is materially easier
