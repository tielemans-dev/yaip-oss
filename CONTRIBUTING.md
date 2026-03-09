# Contributing

Thanks for contributing to YAIP OSS.

## Scope and Boundary Rules

This repository is the OSS runtime baseline. Hosted-only features belong in the private cloud repo.

Do not submit changes that:

- Add managed billing/webhooks (Stripe lifecycle and webhook handlers)
- Add hosted auth enforcement logic that belongs in cloud edge infrastructure
- Add private cloud module imports into OSS runtime code
- Add managed AI subscription entitlements or billing coupling into OSS core

Use extension interfaces in `src/lib/runtime/extensions.ts` when you need cloud-specific behavior.

## Pull Request Expectations

- Keep OSS runtime self-deployable.
- Keep cloud-specific logic outside OSS runtime paths.
- Add or update tests for behavior changes.
- Ensure CI and boundary checks pass.
- Use the pull request template and include screenshots for UI changes.
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` should pass before asking for review.

PRs that weaken OSS/cloud boundaries will be closed.
