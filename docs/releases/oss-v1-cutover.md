# OSS v1 Cutover Checklist

Cutover guide for the first public OSS release with self-host onboarding.

## 1) Repo Split Announcement

- Public OSS repository: `https://github.com/<org>/yaip-oss`
- Private cloud repository: internal `yaip-cloud` (not public)
- Boundary policy reference: `docs/architecture/oss-cloud-boundary.md`

## 2) Migration Guidance

### Existing self-host users

- Pull latest OSS release.
- Apply database migrations: `pnpm exec prisma migrate deploy`
- Ensure required env vars are set (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
- OAuth remains optional; configure provider env vars only if needed.
- Validate setup guard behavior in upgraded environment.

### Existing cloud users

- No user action required.
- Cloud team applies OSS sync and validates cloud adapters (billing, webhooks, hosted auth extensions).

## 3) Release Steps

- [ ] Run OSS QA checklist: `docs/qa/oss-cloud-split-qa.md`
- [ ] Verify OSS boundary checks pass in CI.
- [ ] Create release tag:

```bash
git tag -a oss-v1.0.0 -m "First public OSS release with setup wizard"
git push origin oss-v1.0.0
```

## 4) Post-Release

- Publish release notes summarizing OSS/cloud ownership and onboarding changes.
- Schedule first upstream OSS -> cloud sync cadence review.
