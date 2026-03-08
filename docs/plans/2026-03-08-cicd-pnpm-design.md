# CI Pnpm Version Design

## Goal

Make all GitHub Actions workflows bootstrap `pnpm` from a single repository-defined version so CI does not fail during setup.

## Root cause

`pnpm/action-setup@v4` now requires a pnpm version to come from either:

- the workflow `with.version` field, or
- the repository `package.json` `packageManager` field

This repository only pins `pnpm` inside `.github/workflows/publish-package.yml`. The `CI` and `OSS Boundary` workflows call `pnpm/action-setup@v4` without a version, so they fail before dependency installation.

## Recommended approach

Declare `"packageManager": "pnpm@10.28.2"` in `package.json` and treat that as the single source of truth for all workflows.

Then:

- remove the duplicated explicit pnpm version from `publish-package.yml`
- add a focused test that fails when `package.json` stops declaring a pnpm `packageManager`

## Alternatives considered

### Pin pnpm separately in each workflow

Pros:
- smallest workflow-only diff

Cons:
- duplicates version state across multiple YAML files
- makes future pnpm upgrades easier to miss

### Downgrade or replace `pnpm/action-setup`

Pros:
- could avoid the current requirement temporarily

Cons:
- works around the real issue
- adds maintenance risk without benefit

## Success criteria

- local test coverage fails if the repo stops declaring a pnpm version
- `CI`, `OSS Boundary`, and `Publish Package Artifact` can all resolve pnpm from the repository configuration
