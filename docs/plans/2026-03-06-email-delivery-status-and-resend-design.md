# Email Delivery Status and Resend Design

## Goal

Make outbound email behavior visible and recoverable without turning email into a separate subsystem. Operators should be able to see whether email is configured, understand why a document email did or did not go out, and resend quote or invoice emails without rotating public links.

## Current Problem

`yaip-oss` can send quote, invoice, and invite emails through Resend, but delivery configuration is only visible through deployment environment variables. Quote and invoice send flows also conflate several different cases:

- provider missing
- contact email missing
- actual provider send failure
- successful send

The current UI only surfaces a transient warning string. There is no persistent document-level delivery status, no resend action, and no settings view that explains whether outbound email is configured. In cloud, the product should communicate that email is platform-managed without exposing provider internals in tenant settings.

## Approved Product Decisions

### Settings status

- `yaip-oss` shows outbound email status in Settings.
- OSS status includes:
  - configured vs missing configuration
  - effective sender address
  - missing env var names such as `RESEND_API_KEY` and `FROM_EMAIL`
  - no secret values
- `yaip-cloud` uses the same settings page, but shows email as managed by cloud rather than as a tenant-managed secret.
- Generic email status applies to all outbound email, including invites, but this feature does not add invite resend/history.

### Document-level delivery status

- Quote and invoice detail pages show the last email attempt result, timestamp, and short reason when relevant.
- Delivery status is stored on the document as lightweight operational state, not as a full event log.
- The stored state includes:
  - last attempt timestamp
  - last attempt outcome
  - short machine-readable code
  - short safe human-readable message

### Send and resend behavior

- Draft documents use `Send email`.
- Publicly shareable documents use `Resend email`.
- Resend is allowed for any quote or invoice that is already in a state that can be publicly shared, even if no prior successful system email exists.
- Existing public links are reused for resend. No new public links are minted for retries.
- Recipient email is not edited inline in this pass. Send/resend always uses the document contact email.

### Degraded and failure paths

- If provider configuration is missing, the operator can explicitly choose a degraded path.
- In the degraded path:
  - draft documents may still become `sent`
  - no email is delivered
  - the document records that the send was skipped by design
- If provider configuration exists but the actual send call fails unexpectedly:
  - the document stays `draft`
  - the failure is recorded on the document
  - the user can retry later
- If the contact email is missing or invalid:
  - email send/resend is blocked
  - the UI links to fix the contact
  - the UI also offers a manual copy-link fallback

### Scope boundaries

In scope:

- generic outbound email status in Settings
- quote and invoice delivery status on detail pages
- explicit resend actions for quotes and invoices
- degraded provider-missing send handling
- manual-share fallback for invalid or missing recipient email

Out of scope:

- invite resend/history
- provider event logs
- test-email actions
- inline recipient override during send

## Architecture

### Runtime capabilities

Cloud already uses OSS runtime composition. The cleanest way to express cloud-managed email status is to extend runtime capabilities rather than forking the settings page.

Add an email-delivery capability alongside the existing AI, onboarding, and payments capability groups:

- OSS default: email delivery is user-operated, not managed
- Cloud bootstrap: email delivery is managed

This capability is not responsible for checking whether Resend is configured. It only describes who owns the mail infrastructure boundary. Actual configuration state continues to be resolved server-side from runtime environment.

### Settings server response

Extend `settings.get` so it returns a small `emailDelivery` object that combines:

- runtime ownership mode (`selfhost` vs `managed`)
- effective sender address
- missing env var names
- simple availability/configured state

In OSS, this object powers actionable operator diagnostics. In cloud, it powers a managed status message without exposing provider internals.

### Document delivery persistence

Add lightweight delivery fields to both `Quote` and `Invoice`. The design intentionally duplicates a small amount of schema instead of introducing a shared event table because the product only needs last-attempt visibility right now.

Recommended fields on both models:

- `lastEmailAttemptAt`
- `lastEmailAttemptOutcome`
- `lastEmailAttemptCode`
- `lastEmailAttemptMessage`

Valid outcomes should stay compact and UI-friendly, for example:

- `sent`
- `skipped`
- `failed`

### Shared send semantics

Quote and invoice send logic should use the same decision model:

1. Validate document state and contact email.
2. Resolve public link to reuse.
3. Resolve outbound email runtime/config state.
4. If contact email is unusable, reject the email action and let the UI expose manual share.
5. If provider config is missing and the user did not explicitly confirm degraded send, reject with a specific message.
6. If provider config is missing and the user explicitly confirmed degraded send:
   - record a skipped attempt
   - move draft document to `sent` if needed
7. If provider config exists, attempt email delivery.
8. On success, record `sent`.
9. On unexpected provider failure, record `failed` and leave draft documents unsent.

## UI Shape

### Settings

Add an email-delivery card near existing integration/runtime settings. It should show:

- status badge
- effective sender
- missing env vars in OSS when misconfigured
- cloud-managed copy in cloud distribution

### Quote and invoice detail pages

Add a compact delivery status block near existing send/payment/share actions. It should show:

- last delivery outcome
- last attempt timestamp
- short reason text
- `Send email` or `Resend email`
- public-link copy fallback when email is blocked or unavailable

The degraded path should use a confirmation modal. Normal configured delivery remains a single-step action.

## Verification

Required verification for implementation:

- runtime capability tests for email managed/unmanaged behavior
- settings router tests for OSS diagnostics and cloud managed status
- quote send/resend integration tests covering:
  - success
  - provider missing with explicit degraded send
  - provider failure keeping quote in `draft`
  - missing contact email blocking send
- invoice send/resend integration tests covering the same branches
- UI/component tests for:
  - settings email status rendering
  - detail-page delivery status rendering
  - resend action labels
  - degraded-path confirmation

## Risks and Mitigations

1. Risk: send semantics become inconsistent between quote and invoice flows.
   Mitigation: extract shared delivery-status helpers and keep branch logic parallel.

2. Risk: cloud settings accidentally expose provider implementation details.
   Mitigation: use runtime capability to gate the settings presentation layer and keep provider diagnostics OSS-only.

3. Risk: delivery metadata grows into a pseudo event log.
   Mitigation: store only last-attempt state in this pass and defer provider event persistence to a later operational feature.
