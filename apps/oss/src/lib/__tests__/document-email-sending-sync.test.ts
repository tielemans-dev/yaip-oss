import { describe, expect, it } from "vitest"
import {
  createDocumentSendingSyncUpdate,
  readDocumentSendingSyncState,
} from "../document-email-sending"

describe("document email sending sync metadata", () => {
  it("reads webhook sync metadata from org settings", () => {
    const syncedAt = new Date("2026-03-06T18:40:00.000Z")

    expect(
      readDocumentSendingSyncState({
        documentSendingLastSyncedAt: syncedAt,
        documentSendingLastSyncSource: "webhook",
      })
    ).toEqual({
      lastSyncedAt: syncedAt,
      lastSyncSource: "webhook",
    })
  })

  it("defaults missing sync metadata to null", () => {
    expect(
      readDocumentSendingSyncState({
        documentSendingLastSyncedAt: null,
        documentSendingLastSyncSource: null,
      })
    ).toEqual({
      lastSyncedAt: null,
      lastSyncSource: null,
    })
  })

  it("builds a webhook sync update payload", () => {
    const at = new Date("2026-03-06T18:41:00.000Z")

    expect(createDocumentSendingSyncUpdate({ at, source: "webhook" })).toEqual({
      documentSendingLastSyncedAt: at,
      documentSendingLastSyncSource: "webhook",
    })
  })

  it("builds a manual sync update payload", () => {
    const at = new Date("2026-03-06T18:42:00.000Z")

    expect(createDocumentSendingSyncUpdate({ at, source: "manual" })).toEqual({
      documentSendingLastSyncedAt: at,
      documentSendingLastSyncSource: "manual",
    })
  })
})
