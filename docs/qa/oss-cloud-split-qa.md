# OSS/Cloud Split QA Checklist

This checklist verifies OSS behavior after the split and documents cloud verification to run in the private cloud repository.

## 1) OSS Self-Host Verification

- [ ] Start the app with Docker: `docker compose up --build`
- [ ] Open the app and complete the first-launch setup wizard.
- [ ] Create a contact.
- [ ] Create a quote.
- [ ] Convert quote to invoice.
- [ ] Send invoice email (when `RESEND_API_KEY` and `FROM_EMAIL` are configured).
- [ ] Generate invoice PDF and verify rendering.
- [ ] Confirm billing page does not expose hosted Stripe actions.
- [ ] Confirm no Stripe runtime dependency is required for normal OSS operation.

## 2) Cloud Verification (Private `yaip-cloud` Repo)

- [ ] Configure cloud distribution with Stripe billing provider enabled.
- [ ] Verify billing page can create checkout session.
- [ ] Verify billing page can create portal session.
- [ ] Trigger Stripe webhook and confirm subscription state updates in app data.
- [ ] Verify any cloud invoice policy limits are enforced through the cloud billing provider.

## 3) Boundary Regression Checks

- [ ] Run `bash scripts/check-oss-boundaries.sh`
- [ ] Run `pnpm test`
- [ ] Run `pnpm build`

## Notes

- Run this checklist before each OSS release and after cloud sync merges.
- Record results and known deviations in release notes.
