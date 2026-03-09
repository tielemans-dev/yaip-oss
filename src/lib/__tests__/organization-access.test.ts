import { describe, expect, it } from "vitest"

import {
  getOrganizationAccessState,
  type OrganizationSummary,
} from "../organization-access"

const org = (id: string, createdAt = new Date("2026-03-09T00:00:00.000Z")): OrganizationSummary => ({
  id,
  name: `Org ${id}`,
  slug: `org-${id}`,
  createdAt,
})

describe("getOrganizationAccessState", () => {
  it("keeps the current session when an active org is already present", () => {
    expect(
      getOrganizationAccessState({
        activeOrganizationId: "org_active",
        organizations: [org("org_active")],
      })
    ).toEqual({
      kind: "active",
      activeOrganizationId: "org_active",
    })
  })

  it("auto-selects the only organization when no active org is present", () => {
    expect(
      getOrganizationAccessState({
        activeOrganizationId: null,
        organizations: [org("org_single")],
      })
    ).toEqual({
      kind: "auto-select",
      organizationId: "org_single",
    })
  })

  it("shows the chooser when multiple organizations exist", () => {
    expect(
      getOrganizationAccessState({
        activeOrganizationId: null,
        organizations: [org("org_a"), org("org_b")],
      })
    ).toEqual({
      kind: "choose",
      organizations: [org("org_a"), org("org_b")],
    })
  })

  it("shows create when no organizations exist", () => {
    expect(
      getOrganizationAccessState({
        activeOrganizationId: null,
        organizations: [],
      })
    ).toEqual({
      kind: "create",
    })
  })
})
