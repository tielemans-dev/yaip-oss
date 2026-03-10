import { TRPCError } from "@trpc/server"
import { prisma } from "../db"
import { isCloudDistribution } from "../distribution"
import { getCloudOnboardingState } from "../cloud-onboarding"

export async function assertCloudOnboardingComplete(
  organizationId: string
) {
  if (!isCloudDistribution) {
    return
  }

  const settings = await prisma.orgSettings.findUnique({
    where: { organizationId },
    select: {
      onboardingStatus: true,
      onboardingMethod: true,
      onboardingProfile: true,
      onboardingInvoicingIdentity: true,
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

  const onboardingState = getCloudOnboardingState(
    settings
      ? {
          ...settings,
          primaryTaxId: primaryTaxId?.value ?? null,
        }
      : null
  )

  if (!onboardingState.isComplete) {
    const missing = onboardingState.readiness?.missing ?? []
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        missing.length > 0
          ? `Complete onboarding before creating documents. Missing: ${missing.join(", ")}`
          : "Complete onboarding before creating documents.",
    })
  }
}
