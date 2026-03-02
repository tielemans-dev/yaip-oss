# Runtime Extension Interface

This document defines how private cloud code can extend OSS behavior without forking core runtime code.

## Goals

- Keep OSS runnable and self-hostable by default.
- Allow cloud/private runtime to add features (for example managed AI) with no OSS duplication.
- Keep entitlement and billing enforcement in private cloud code.

## OSS Contract

`src/lib/runtime/extensions.ts` exports:

- `setRuntimeExtensions(extensions)` to register runtime extensions
- `getRuntimeExtensions()` for inspection/testing
- `getRuntimeCapabilities()` to resolve effective feature capabilities

Each extension provides a stable `id` and optional `resolveCapabilities(base)` patcher.

The OSS baseline exposes capabilities via `trpc.runtime.capabilities`.

## AI Capability Model

Current capability key:

- `aiInvoiceDraft`
  - `enabled`
  - `byok`
  - `managed`
  - `managedRequiresSubscription`
  - `maxPromptChars`

Default OSS behavior:

- BYOK enabled
- Managed mode disabled

## Cloud Composition Pattern

Cloud/private runtime should register a private extension at startup, for example:

```ts
import { setRuntimeExtensions } from "#/lib/runtime/extensions"

setRuntimeExtensions([
  {
    id: "cloud-managed-ai",
    resolveCapabilities: () => ({
      aiInvoiceDraft: {
        managed: true,
        managedRequiresSubscription: true,
      },
    }),
  },
])
```

The private cloud repo owns managed AI provider implementation, entitlement checks, and billing coupling.
