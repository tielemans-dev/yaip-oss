# OSS and Cloud Ownership Boundary

This document defines ownership boundaries between the public OSS runtime (`yaip-oss`) and the private hosted runtime (`yaip-cloud`).

## Ownership Matrix

| Area | OSS (`yaip-oss`) | Cloud (`yaip-cloud`) |
| --- | --- | --- |
| Invoicing, quotes, contacts, catalog | Owns | Consumes |
| Auth core (users/sessions/org roles/invites) | Owns | Extends only |
| OAuth provider setup | Optional + documented | Enabled by default in hosted |
| Billing abstraction | Owns interface + noop provider | Owns Stripe provider |
| Stripe webhooks and subscription lifecycle | Not present | Owns |
| Runtime extension contracts | Owns stable extension interfaces | Owns private extension implementations |
| Managed AI providers + entitlements | Not present | Owns |
| Self-host setup wizard | Owns | Consumes + may bypass in hosted |
| Docker compose + self-host docs | Owns | N/A |
| Managed infrastructure/runbooks | Not present | Owns |

## Import Constraints

- OSS runtime code must not import cloud-only modules.
- OSS billing code may only depend on billing interfaces and OSS providers.
- Cloud-specific Stripe, webhook, and managed infra logic must stay out of OSS runtime paths.
- Cloud distribution code may consume OSS interfaces, but OSS code must remain cloud-agnostic.
- Cloud/private behavior should be integrated through OSS runtime extension interfaces, not by embedding private imports in OSS runtime modules.

## Enforcement

- A dedicated CI workflow (`oss-boundary.yml`) runs static checks for forbidden Stripe references in OSS runtime and templates.
- Boundary checks run alongside tests and build to prevent regressions.
- CODEOWNERS protection is applied on boundary-sensitive files and extension contracts.
