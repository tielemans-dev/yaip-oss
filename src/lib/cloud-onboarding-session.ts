import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { getCloudOnboardingState } from "./cloud-onboarding"

export const getActiveOrgCloudOnboardingStatus = createServerFn({
  method: "GET",
}).handler(async () => {
  const [{ auth }, { prisma }] = await Promise.all([
    import("./auth"),
    import("./db"),
  ])
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  const organizationId = session?.session.activeOrganizationId

  if (!organizationId) {
    return getCloudOnboardingState(null)
  }

  const settings = await prisma.orgSettings.findUnique({
    where: { organizationId },
    select: {
      onboardingStatus: true,
      onboardingProfile: true,
      onboardingVersion: true,
      onboardingCompletedAt: true,
      countryCode: true,
      locale: true,
      timezone: true,
      defaultCurrency: true,
      taxRegime: true,
      pricesIncludeTax: true,
      companyName: true,
      companyAddress: true,
      companyEmail: true,
      invoicePrefix: true,
      invoiceNextNum: true,
      quotePrefix: true,
      quoteNextNum: true,
    },
  })

  const primaryTaxId = await prisma.organizationTaxId.findFirst({
    where: { organizationId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { value: true },
  })

  return getCloudOnboardingState({
    ...settings,
    primaryTaxId: primaryTaxId?.value ?? null,
  })
})
