export type OrganizationSummary = {
  id: string
  name: string
  slug: string
  createdAt: Date | string
}

export type OrganizationAccessState =
  | {
      kind: "active"
      activeOrganizationId: string
    }
  | {
      kind: "auto-select"
      organizationId: string
    }
  | {
      kind: "choose"
      organizations: OrganizationSummary[]
    }
  | {
      kind: "create"
    }

export function getOrganizationAccessState(input: {
  activeOrganizationId?: string | null
  organizations?: OrganizationSummary[] | null
}): OrganizationAccessState {
  if (input.activeOrganizationId) {
    return {
      kind: "active",
      activeOrganizationId: input.activeOrganizationId,
    }
  }

  const organizations = input.organizations ?? []

  if (organizations.length === 1) {
    return {
      kind: "auto-select",
      organizationId: organizations[0].id,
    }
  }

  if (organizations.length > 1) {
    return {
      kind: "choose",
      organizations,
    }
  }

  return {
    kind: "create",
  }
}
