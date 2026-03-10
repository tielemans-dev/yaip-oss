# Bun Migration Design

## Goal

Move YAIP OSS from `pnpm` to Bun as the only supported package manager and runtime for local development, CI, release packaging, and self-hosted deployment.

## Current Context

The repository is currently centered on `pnpm`:

- root `package.json` declares `packageManager: "pnpm@10.28.2"`
- root and package scripts use `pnpm --filter`, `pnpm exec`, and `pnpm pack`
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` define install and workspace behavior
- GitHub Actions workflows bootstrap `pnpm`
- Playwright and repo-owned helper scripts shell out to `pnpm`
- contributor documentation teaches `pnpm` commands
- a focused test enforces `pnpm` package-manager metadata

This creates a large operational dependency on `pnpm` across the full repository lifecycle.

## Decision

Adopt Bun as the only supported package manager and runtime.

Explicitly:

- local `pnpm` workflows will stop working
- the repository will identify itself as Bun-only
- deployment will require Bun rather than Node compatibility
- published package export surfaces remain unchanged

## Considered Approaches

### 1. Full hard cutover to Bun everywhere

Replace `pnpm` with Bun for installs, scripts, CI bootstrap, packaging, Playwright startup, and self-hosted runtime.

Pros:

- matches the desired repo contract exactly
- avoids a mixed-tool maintenance period
- makes onboarding and failure analysis simpler

Cons:

- highest one-time migration churn
- requires careful validation for Prisma, Playwright, and packing

### 2. Bun package manager with Node-compatible runtime

Use Bun for package management and CI but preserve Node-safe runtime paths.

Pros:

- lower runtime change risk

Cons:

- conflicts with the requirement that deployment should require Bun
- leaves the runtime contract ambiguous

### 3. Partial migration with Bun wrappers

Switch install entrypoints to Bun while retaining compatibility shims for older `pnpm`-based flows.

Pros:

- fastest initial cutover

Cons:

- contradicts the requirement to stop supporting non-Bun tooling
- keeps hidden operational debt in scripts and docs

## Recommended Approach

Use approach 1: full hard cutover to Bun everywhere.

This gives the repository one clear platform contract:

- Bun is the package manager
- Bun is the command runner
- Bun is the required self-host runtime

That contract is stricter, but it removes ambiguity and lines up with the desired contributor and deployment experience.

## Design

### Repository contract

The repo becomes Bun-native and Bun-only.

Changes:

- replace `pnpm` package-manager metadata with Bun metadata
- add `.bun-version` as the single source of truth for the Bun version
- replace `pnpm` workspace configuration with Bun workspace configuration
- replace `pnpm-lock.yaml` with Bun’s lockfile
- update documentation and tests to state that this is a Bun repo

Non-goals:

- no `pnpm` compatibility layer
- no dual Bun/Node runtime support
- no changes to the OSS/cloud boundary model
- no changes to the public `@yaip/oss`, `@yaip/contracts`, or `@yaip/shared` exports

### Workspace and script migration

Keep the existing Turbo task graph and migrate command entrypoints around it.

Changes:

- rewrite root scripts from `pnpm --filter ...` to Bun workspace commands
- rewrite package-local scripts that use `pnpm exec`
- update lifecycle scripts in `apps/oss`, especially `migrate`, `predev`, `prebuild`, and `pretest`
- update helper scripts that currently spawn `pnpm`, especially:
  - `scripts/predev-bootstrap.mjs`
  - `scripts/check-packed-build.mjs`
- update Playwright’s `webServer.command` to Bun

Rationale:

- Turbo already provides the multi-package task orchestration needed here
- keeping Turbo reduces the migration surface to package-manager/runtime behavior rather than build topology

### CI and release packaging

Replace `pnpm` bootstrap and command usage with Bun.

Changes:

- replace `pnpm/action-setup` with `oven-sh/setup-bun`
- read the Bun version from `.bun-version`
- switch dependency installation to Bun’s frozen/locked mode
- rewrite workflow commands for lint, typecheck, tests, Prisma, Playwright, build, and packaging
- preserve the current release artifact contract by still producing package tarballs for:
  - `apps/oss`
  - `packages/contracts`
  - `packages/shared`

### Enforcement and contributor messaging

The repo should tell contributors clearly that Bun is required.

Changes:

- replace the current package-manager test so it asserts Bun metadata instead of `pnpm`
- add or extend repo-owned checks so active scripts, workflows, and contributor docs do not keep stale `pnpm` instructions
- rewrite README and app README commands to Bun
- make helper-script error messages refer to Bun, not `pnpm`

## Validation Strategy

Validation should proceed from the highest-risk surfaces inward.

### Focused verification

Run focused checks first for:

- Bun install and workspace resolution
- package-manager metadata enforcement tests
- Prisma generate and migrate flow
- Playwright web server startup
- packed artifact verification

### Required repo verification

Before claiming completion, run:

- `bun run lint`
- `bun run typecheck`
- `bun run test`

Because setup and browser startup behavior change here, also run targeted browser verification through the existing E2E smoke path.

## Risks And Mitigations

### Risk: command semantics differ from `pnpm exec`

Some commands may behave differently under Bun, especially Prisma and Playwright flows.

Mitigation:

- migrate each `pnpm` invocation explicitly
- validate the affected flows directly rather than relying on bulk repo verification alone

### Risk: workspace filtering is not a drop-in replacement

Current root scripts depend on `pnpm --filter`.

Mitigation:

- preserve Turbo orchestration where possible
- convert filters deliberately and verify each root task entrypoint

### Risk: package packing behavior changes

The release workflows depend on tarballs containing exact files and versions.

Mitigation:

- update the existing packed-artifact verification script to Bun
- verify tarball contents after migration

### Risk: version drift in CI

Using different Bun versions locally and in CI would make failures harder to reason about.

Mitigation:

- pin Bun exactly in `.bun-version`
- have CI read from that single file

## Success Criteria

The migration is complete when:

- no active repo-owned workflow requires `pnpm`
- the repository declares itself Bun-only in metadata, docs, and tests
- local development, Prisma flows, tests, build, release packing, and CI all work with Bun
- self-hosted deployment requires Bun
- the published package surfaces remain stable
