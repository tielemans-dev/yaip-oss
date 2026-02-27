import { describe, expect, it, vi } from "vitest"
import {
  ensureInstallationState,
  type InstallationStateRecord,
  type InstallationStateStore,
} from "../installation-state"
import { isSetupGuardBypassPath, shouldRedirectToSetup } from "../setup-guard"

function makeState(overrides: Partial<InstallationStateRecord> = {}): InstallationStateRecord {
  const now = new Date("2026-02-27T00:00:00.000Z")
  return {
    id: "default",
    isSetupComplete: false,
    distribution: "selfhost",
    setupVersion: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeStore(overrides: Partial<InstallationStateStore> = {}): InstallationStateStore {
  return {
    findById: async () => null,
    create: async () => makeState(),
    countOrganizations: async () => 0,
    countMembers: async () => 0,
    ...overrides,
  }
}

describe("installation state", () => {
  it("returns existing state when present", async () => {
    const existing = makeState({ isSetupComplete: true, distribution: "cloud" })
    const store = makeStore({
      findById: vi.fn(async () => existing),
      create: vi.fn(async () => makeState()),
    })

    const state = await ensureInstallationState({ store })

    expect(state).toEqual(existing)
    expect(store.create).not.toHaveBeenCalled()
  })

  it("creates setup-complete state for upgraded installs with org/member data", async () => {
    const create = vi.fn(async (data: Parameters<InstallationStateStore["create"]>[0]) =>
      makeState(data)
    )
    const store = makeStore({
      findById: vi.fn(async () => null),
      countOrganizations: vi.fn(async () => 1),
      countMembers: vi.fn(async () => 1),
      create,
    })

    const state = await ensureInstallationState({ store, distribution: "selfhost" })

    expect(create).toHaveBeenCalledWith({
      id: "default",
      isSetupComplete: true,
      distribution: "selfhost",
      setupVersion: 1,
    })
    expect(state.isSetupComplete).toBe(true)
  })

  it("recovers when state creation races and record already exists", async () => {
    const existing = makeState({ isSetupComplete: true })
    const findById = vi
      .fn<InstallationStateStore["findById"]>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing)
    const create = vi
      .fn<InstallationStateStore["create"]>()
      .mockRejectedValueOnce({ code: "P2002" })

    const state = await ensureInstallationState({
      store: makeStore({
        findById,
        create,
      }),
    })

    expect(state).toEqual(existing)
  })
})

describe("setup guard paths", () => {
  it("allows setup and bootstrap paths while setup is incomplete", () => {
    expect(isSetupGuardBypassPath("/setup")).toBe(true)
    expect(isSetupGuardBypassPath("/setup/step-2")).toBe(true)
    expect(isSetupGuardBypassPath("/login")).toBe(true)
    expect(isSetupGuardBypassPath("/signup")).toBe(true)
    expect(isSetupGuardBypassPath("/accept-invitation/invite-123")).toBe(true)
    expect(isSetupGuardBypassPath("/api/auth/session")).toBe(true)
    expect(isSetupGuardBypassPath("/api/health")).toBe(true)
    expect(isSetupGuardBypassPath("/healthz")).toBe(true)
  })

  it("redirects only non-setup routes when setup is incomplete", () => {
    expect(shouldRedirectToSetup("/", false)).toBe(true)
    expect(shouldRedirectToSetup("/_app/invoices", false)).toBe(true)
    expect(shouldRedirectToSetup("/setup", false)).toBe(false)
    expect(shouldRedirectToSetup("/login", false)).toBe(false)
    expect(shouldRedirectToSetup("/_app/invoices", true)).toBe(false)
  })
})
