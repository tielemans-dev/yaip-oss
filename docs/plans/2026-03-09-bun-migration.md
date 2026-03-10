# Bun Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate YAIP OSS to Bun as the only supported package manager and runtime across local development, CI, packaging, and self-hosted deployment.

**Architecture:** Keep the current workspace layout, Turbo task graph, and published package surfaces intact while replacing `pnpm`-specific metadata, scripts, helper tooling, CI setup, and container runtime entrypoints with Bun-native equivalents. Make the Bun version deterministic through `.bun-version`, remove `pnpm` repo contracts, and add focused checks that fail when Bun-only expectations regress.

**Tech Stack:** Bun, Turbo, TypeScript, Vitest, Playwright, Prisma, GitHub Actions, Docker

---

### Task 1: Replace Repository Package-Manager Metadata

**Files:**
- Create: `.bun-version`
- Modify: `package.json`
- Modify: `scripts/__tests__/package-manager.test.ts`
- Delete: `pnpm-workspace.yaml`
- Delete: `pnpm-lock.yaml`

**Step 1: Write the failing test**

Replace the current `pnpm` assertion in [scripts/__tests__/package-manager.test.ts](/home/mpt/projects/yaip/yaip-oss/scripts/__tests__/package-manager.test.ts) with a Bun-only contract:

```ts
import { existsSync, readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("repository Bun contract", () => {
  it("declares Bun as package manager and pins a Bun version file", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    ) as { packageManager?: string; workspaces?: string[] }

    expect(packageJson.packageManager).toMatch(/^bun@/)
    expect(packageJson.workspaces).toEqual([".", "apps/*", "packages/*", "scripts"])
    expect(existsSync(new URL("../../.bun-version", import.meta.url))).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bunx vitest run scripts/__tests__/package-manager.test.ts`
Expected: FAIL because `package.json` still declares `pnpm`, has no Bun workspaces, and `.bun-version` does not exist.

**Step 3: Write minimal implementation**

Update [package.json](/home/mpt/projects/yaip/yaip-oss/package.json) to declare Bun and inline workspaces, and add `.bun-version` with the exact Bun pin:

```json
{
  "packageManager": "bun@1.2.5",
  "workspaces": [".", "apps/*", "packages/*", "scripts"]
}
```

`.bun-version`

```text
1.2.5
```

Then delete [pnpm-workspace.yaml](/home/mpt/projects/yaip/yaip-oss/pnpm-workspace.yaml) and [pnpm-lock.yaml](/home/mpt/projects/yaip/yaip-oss/pnpm-lock.yaml).

**Step 4: Run test to verify it passes**

Run: `bunx vitest run scripts/__tests__/package-manager.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add .bun-version package.json scripts/__tests__/package-manager.test.ts pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: declare bun as workspace package manager"
```

### Task 2: Convert Workspace Scripts And Repo-Owned Helpers

**Files:**
- Modify: `package.json`
- Modify: `apps/oss/package.json`
- Modify: `packages/contracts/package.json`
- Modify: `packages/shared/package.json`
- Modify: `scripts/package.json`
- Modify: `scripts/predev-bootstrap.mjs`
- Modify: `scripts/check-packed-build.mjs`
- Modify: `apps/oss/playwright.config.ts`

**Step 1: Write the failing test**

Add a second focused assertion to [scripts/__tests__/package-manager.test.ts](/home/mpt/projects/yaip/yaip-oss/scripts/__tests__/package-manager.test.ts) that fails if repo-owned scripts still shell out to `pnpm`:

```ts
it("does not keep pnpm in active package scripts or helper commands", () => {
  const files = [
    "package.json",
    "apps/oss/package.json",
    "packages/contracts/package.json",
    "packages/shared/package.json",
    "scripts/package.json",
    "scripts/predev-bootstrap.mjs",
    "scripts/check-packed-build.mjs",
    "apps/oss/playwright.config.ts",
  ]

  for (const file of files) {
    const text = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8")
    expect(text).not.toContain("pnpm")
  }
})
```

**Step 2: Run test to verify it fails**

Run: `bunx vitest run scripts/__tests__/package-manager.test.ts`
Expected: FAIL because the listed manifests and scripts still contain `pnpm`.

**Step 3: Write minimal implementation**

Convert package scripts to Bun-native forms.

Examples to apply:

[package.json](/home/mpt/projects/yaip/yaip-oss/package.json)

```json
{
  "scripts": {
    "dev": "bun --filter @yaip/oss dev",
    "preview": "bun --filter @yaip/oss preview",
    "typecheck:app": "bun --filter @yaip/oss typecheck:app",
    "test:e2e": "bun --filter @yaip/oss test:e2e"
  }
}
```

[apps/oss/package.json](/home/mpt/projects/yaip/yaip-oss/apps/oss/package.json)

```json
{
  "scripts": {
    "migrate": "bun run db:start && bun run prisma:migrate",
    "predev": "bun run prisma:generate && node ../../scripts/predev-bootstrap.mjs",
    "dev": "YAIP_DISTRIBUTION=selfhost VITE_YAIP_DISTRIBUTION=selfhost node ../../scripts/run-with-workspace-env.mjs bun vite dev --port 3000",
    "build": "node ../../scripts/run-with-workspace-env.mjs bun vite build",
    "test": "bun run i18n:check && node ../../scripts/run-with-workspace-env.mjs bun vitest run -c vitest.config.ts"
  }
}
```

[packages/contracts/package.json](/home/mpt/projects/yaip/yaip-oss/packages/contracts/package.json), [packages/shared/package.json](/home/mpt/projects/yaip/yaip-oss/packages/shared/package.json), and [scripts/package.json](/home/mpt/projects/yaip/yaip-oss/scripts/package.json)

```json
{
  "scripts": {
    "lint": "bunx oxlint --deny-warnings --report-unused-disable-directives src",
    "typecheck": "bunx tsc --noEmit -p tsconfig.json",
    "test": "bunx vitest run"
  }
}
```

Update helper scripts:

[scripts/predev-bootstrap.mjs](/home/mpt/projects/yaip/yaip-oss/scripts/predev-bootstrap.mjs)

```js
const bunCommand = process.platform === "win32" ? "bun.exe" : "bun"

if (target.kind === "missing") {
  console.error("DATABASE_URL is required. Set it in .env before running bun dev.")
  process.exit(1)
}

run(bunCommand, ["run", "db:start"])
run(bunCommand, ["x", "prisma", "migrate", "deploy"])
```

[scripts/check-packed-build.mjs](/home/mpt/projects/yaip/yaip-oss/scripts/check-packed-build.mjs)

```js
execFileSync("bun", ["pm", "pack", "--destination", outDir], {
  cwd,
  stdio: "inherit",
})
```

[apps/oss/playwright.config.ts](/home/mpt/projects/yaip/yaip-oss/apps/oss/playwright.config.ts)

```ts
command:
  "bunx prisma generate && bunx prisma migrate deploy && bun vite dev --port 3000 --host 127.0.0.1",
```

**Step 4: Run tests to verify they pass**

Run:
- `bunx vitest run scripts/__tests__/package-manager.test.ts`
- `bun --cwd scripts test`

Expected: PASS.

**Step 5: Commit**

```bash
git add package.json apps/oss/package.json packages/contracts/package.json packages/shared/package.json scripts/package.json scripts/predev-bootstrap.mjs scripts/check-packed-build.mjs apps/oss/playwright.config.ts scripts/__tests__/package-manager.test.ts
git commit -m "refactor: move workspace scripts to bun"
```

### Task 3: Migrate Container Runtime And Release Packaging

**Files:**
- Modify: `Dockerfile`
- Modify: `docker-entrypoint.sh`
- Modify: `scripts/check-packed-build.mjs`

**Step 1: Write the failing verification**

Run the existing artifact verifier before changing the container and pack flow:

Run: `node scripts/check-packed-build.mjs`
Expected: FAIL once Task 2 is in place if packing still depends on removed `pnpm`, or PASS before Task 2 if the script has not yet been migrated. Record the exact behavior before proceeding.

**Step 2: Write the implementation**

Update [Dockerfile](/home/mpt/projects/yaip/yaip-oss/Dockerfile) so build and runtime images use Bun instead of Node+Corepack.

Target shape:

```dockerfile
FROM oven/bun:1.2.5 AS base

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock .bun-version ./
RUN bun install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/.output ./.output
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./
COPY --from=build /app/bun.lock ./
RUN bun install --frozen-lockfile --production
```

Update [docker-entrypoint.sh](/home/mpt/projects/yaip/yaip-oss/docker-entrypoint.sh):

```sh
echo "Running database migrations..."
bunx prisma migrate deploy

echo "Starting server..."
bun .output/server/index.mjs
```

If Bun’s production install does not retain `prisma` CLI for runtime migrations, adjust the runtime image to include the minimum required dependency set explicitly and document that reason in the Dockerfile.

**Step 3: Run focused verification**

Run:
- `node scripts/check-packed-build.mjs`
- `docker build -t yaip-oss-bun .`

Expected:
- artifact verifier passes
- Docker image builds successfully with Bun-only steps

**Step 4: Run a runtime smoke check**

Run:
- `docker run --rm yaip-oss-bun bun --version`

Expected: prints the pinned Bun version.

**Step 5: Commit**

```bash
git add Dockerfile docker-entrypoint.sh scripts/check-packed-build.mjs
git commit -m "build: require bun in container runtime"
```

### Task 4: Migrate CI Workflows And Contributor Documentation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/oss-boundary.yml`
- Modify: `.github/workflows/publish-package.yml`
- Modify: `README.md`
- Modify: `apps/oss/README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

**Step 1: Write the failing test**

Extend [scripts/__tests__/package-manager.test.ts](/home/mpt/projects/yaip/yaip-oss/scripts/__tests__/package-manager.test.ts) with a doc/workflow guard:

```ts
it("does not leave pnpm in contributor-facing docs or workflows", () => {
  const files = [
    ".github/workflows/ci.yml",
    ".github/workflows/oss-boundary.yml",
    ".github/workflows/publish-package.yml",
    "README.md",
    "apps/oss/README.md",
    "CONTRIBUTING.md",
    "AGENTS.md",
    "CLAUDE.md",
  ]

  for (const file of files) {
    const text = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8")
    expect(text).not.toContain("pnpm")
  }
})
```

**Step 2: Run test to verify it fails**

Run: `bunx vitest run scripts/__tests__/package-manager.test.ts`
Expected: FAIL because workflows and docs still teach `pnpm`.

**Step 3: Write the implementation**

Convert workflows to Bun.

Target edits:

`.github/workflows/ci.yml`

```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v2
  with:
    bun-version-file: .bun-version

- name: Install dependencies
  run: bun install --frozen-lockfile

- name: Lint
  run: bun run lint
```

Use the same pattern in `.github/workflows/oss-boundary.yml` and `.github/workflows/publish-package.yml`, replacing `pnpm` commands with `bun run`, `bunx prisma ...`, and `bun pm pack --destination ...` where appropriate.

Update contributor docs and repo instructions so all command examples are Bun-based:

```md
- `bun run lint`, `bun run typecheck`, and `bun run test` should pass before asking for review.
```

Also update setup prerequisites to require Bun and self-host deployment instructions to use Bun.

**Step 4: Run tests to verify they pass**

Run:
- `bunx vitest run scripts/__tests__/package-manager.test.ts`
- `rg -n "pnpm" .github/workflows README.md apps/oss/README.md CONTRIBUTING.md AGENTS.md CLAUDE.md`

Expected:
- Vitest passes
- `rg` returns no active Bun-migration misses in those files

**Step 5: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/oss-boundary.yml .github/workflows/publish-package.yml README.md apps/oss/README.md CONTRIBUTING.md AGENTS.md CLAUDE.md scripts/__tests__/package-manager.test.ts
git commit -m "docs: declare bun-only contributor workflow"
```

### Task 5: Generate Bun Lockfile And Run Full Verification

**Files:**
- Create: `bun.lock`
- Modify: any files updated by Bun install resolution if required

**Step 1: Generate the lockfile**

Run: `bun install`
Expected: a Bun lockfile is generated and workspace dependencies resolve successfully.

**Step 2: Run focused package and app checks**

Run:
- `bun run prisma:generate`
- `bun run test:integration`
- `bun run build`
- `bun run test:e2e`

Expected:
- Prisma client generation succeeds under Bun
- integration tests pass
- build passes
- targeted browser smoke tests pass

**Step 3: Run required repo verification**

Run:
- `bun run lint`
- `bun run typecheck`
- `bun run test`

Expected: all three commands pass.

**Step 4: Inspect final diff for stale pnpm references**

Run: `rg -n "pnpm" . -g '!docs/plans/**' -g '!node_modules/**' -g '!.git/**'`
Expected: no results in active repository files.

**Step 5: Commit**

```bash
git add bun.lock .
git commit -m "chore: complete bun migration"
```
