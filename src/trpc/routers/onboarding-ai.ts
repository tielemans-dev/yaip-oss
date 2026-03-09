import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { getCloudOnboardingState } from "../../lib/cloud-onboarding"
import { isCloudDistribution } from "../../lib/distribution"
import {
  type OnboardingMissingField,
  evaluateOnboardingReadiness,
} from "../../lib/onboarding/readiness"
import {
  getRequirementRules,
  listFollowupQuestions as buildFollowupQuestions,
  onboardingAiSuggestionSchema,
  onboardingPatchSchema,
  onboardingTaxRegimeSchema,
} from "../../lib/onboarding/ai-contract"
import { prisma } from "../../lib/db"
import { getRuntimeCapabilities } from "../../lib/runtime/extensions"
import { getOnboardingAiService } from "../../lib/runtime/services"
import { orgProcedure, router } from "../init"

const countryCodeSchema = z
  .string()
  .trim()
  .length(2)
  .transform((value) => value.toUpperCase())

const onboardingValuesSchema = z
  .object({
    companyName: z.string().trim().max(120).nullable().optional(),
    companyAddress: z.string().trim().max(240).nullable().optional(),
    companyEmail: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0 ? null : value,
      z.string().trim().email().nullable().optional()
    ),
    countryCode: countryCodeSchema.nullable().optional(),
    locale: z.string().trim().min(2).max(16).nullable().optional(),
    timezone: z.string().trim().min(1).max(120).nullable().optional(),
    defaultCurrency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/)
      .nullable()
      .optional(),
    taxRegime: onboardingTaxRegimeSchema.nullable().optional(),
    pricesIncludeTax: z.boolean().nullable().optional(),
    invoicePrefix: z
      .string()
      .trim()
      .regex(/^[A-Z0-9-]{1,10}$/)
      .nullable()
      .optional(),
    invoiceNextNum: z.number().int().min(1).nullable().optional(),
    quotePrefix: z
      .string()
      .trim()
      .regex(/^[A-Z0-9-]{1,10}$/)
      .nullable()
      .optional(),
    quoteNextNum: z.number().int().min(1).nullable().optional(),
    primaryTaxId: z.string().trim().max(40).nullable().optional(),
    primaryTaxIdScheme: z.string().trim().max(40).nullable().optional(),
  })
  .strict()

const getRequirementRulesInputSchema = z.object({
  countryCode: countryCodeSchema.optional(),
  taxRegime: onboardingTaxRegimeSchema.optional(),
})

const suggestOnboardingPatchInputSchema = z.object({
  userMessage: z.string().trim().min(4).max(4000),
  currentValues: onboardingValuesSchema.optional(),
  missing: z.array(z.string().trim().min(1)).optional(),
})

const applyOnboardingPatchInputSchema = z.object({
  patch: onboardingPatchSchema,
  source: z.enum(["ai", "manual"]),
})

const validateReadinessInputSchema = z.object({
  values: onboardingValuesSchema,
})

const listFollowupQuestionsInputSchema = z.object({
  missing: z.array(z.string().trim().min(1)),
  values: onboardingValuesSchema.optional(),
})

function assertCloudOnboardingAiEnabled() {
  if (!isCloudDistribution) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Onboarding AI is cloud-only",
    })
  }

  const capabilities = getRuntimeCapabilities()
  if (!capabilities.onboardingAi.enabled) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Onboarding AI is disabled for this runtime",
    })
  }
}

async function loadSnapshot(organizationId: string) {
  const settings = await prisma.orgSettings.upsert({
    where: { organizationId },
    update: {},
    create: { organizationId },
    select: {
      onboardingStatus: true,
      onboardingMethod: true,
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
    select: { value: true, scheme: true },
  })

  const readiness = evaluateOnboardingReadiness({
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyEmail: settings.companyEmail,
    countryCode: settings.countryCode,
    locale: settings.locale,
    timezone: settings.timezone,
    defaultCurrency: settings.defaultCurrency,
    taxRegime: settings.taxRegime,
    pricesIncludeTax: settings.pricesIncludeTax,
    invoicePrefix: settings.invoicePrefix,
    invoiceNextNum: settings.invoiceNextNum,
    quotePrefix: settings.quotePrefix,
    quoteNextNum: settings.quoteNextNum,
    primaryTaxId: primaryTaxId?.value ?? null,
  })

  const cloudState = getCloudOnboardingState({
    onboardingStatus: settings.onboardingStatus,
    onboardingMethod: settings.onboardingMethod,
    onboardingProfile: settings.onboardingProfile,
    onboardingVersion: settings.onboardingVersion,
    onboardingCompletedAt: settings.onboardingCompletedAt,
    countryCode: settings.countryCode,
    locale: settings.locale,
    timezone: settings.timezone,
    defaultCurrency: settings.defaultCurrency,
    taxRegime: settings.taxRegime,
    pricesIncludeTax: settings.pricesIncludeTax,
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyEmail: settings.companyEmail,
    invoicePrefix: settings.invoicePrefix,
    invoiceNextNum: settings.invoiceNextNum,
    quotePrefix: settings.quotePrefix,
    quoteNextNum: settings.quoteNextNum,
    primaryTaxId: primaryTaxId?.value ?? null,
  })

  const values = {
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyEmail: settings.companyEmail,
    countryCode: settings.countryCode,
    locale: settings.locale,
    timezone: settings.timezone,
    defaultCurrency: settings.defaultCurrency,
    taxRegime: settings.taxRegime,
    pricesIncludeTax: settings.pricesIncludeTax,
    invoicePrefix: settings.invoicePrefix,
    invoiceNextNum: settings.invoiceNextNum,
    quotePrefix: settings.quotePrefix,
    quoteNextNum: settings.quoteNextNum,
    primaryTaxId: primaryTaxId?.value ?? null,
    primaryTaxIdScheme: primaryTaxId?.scheme ?? null,
  }

  return {
    cloudState,
    readiness,
    values,
  }
}

function toMissingFieldList(fields: readonly string[]): OnboardingMissingField[] {
  const valid: OnboardingMissingField[] = [
    "companyName",
    "companyAddress",
    "companyEmail",
    "countryCode",
    "locale",
    "timezone",
    "defaultCurrency",
    "taxRegime",
    "invoicePrefix",
    "invoiceNextNum",
    "quotePrefix",
    "quoteNextNum",
    "primaryTaxId",
  ]
  const validSet = new Set(valid)
  return fields.filter((field): field is OnboardingMissingField =>
    validSet.has(field as OnboardingMissingField)
  )
}

async function applyPatchToOrgSettings(
  organizationId: string,
  patch: z.infer<typeof onboardingPatchSchema>,
  source: "ai" | "manual"
) {
  const updateData: Record<string, unknown> = {
    onboardingStatus: "in_progress",
    onboardingMethod: source,
  }

  if ("companyName" in patch) updateData.companyName = patch.companyName
  if ("companyAddress" in patch) updateData.companyAddress = patch.companyAddress
  if ("companyEmail" in patch) updateData.companyEmail = patch.companyEmail
  if ("countryCode" in patch) updateData.countryCode = patch.countryCode
  if ("locale" in patch) updateData.locale = patch.locale
  if ("timezone" in patch) updateData.timezone = patch.timezone
  if ("defaultCurrency" in patch) updateData.defaultCurrency = patch.defaultCurrency
  if ("taxRegime" in patch) updateData.taxRegime = patch.taxRegime
  if ("pricesIncludeTax" in patch) updateData.pricesIncludeTax = patch.pricesIncludeTax
  if ("invoicePrefix" in patch) updateData.invoicePrefix = patch.invoicePrefix
  if ("quotePrefix" in patch) updateData.quotePrefix = patch.quotePrefix

  await prisma.orgSettings.upsert({
    where: { organizationId },
    update: updateData,
    create: {
      organizationId,
      ...updateData,
    },
  })

  if ("primaryTaxId" in patch) {
    const existing = await prisma.organizationTaxId.findFirst({
      where: { organizationId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { id: true },
    })
    const scheme = patch.primaryTaxIdScheme ?? "vat"

    if (existing) {
      await prisma.organizationTaxId.update({
        where: { id: existing.id },
        data: {
          value: patch.primaryTaxId,
          scheme,
          isPrimary: true,
        },
      })
    } else {
      await prisma.organizationTaxId.create({
        data: {
          organizationId,
          value: patch.primaryTaxId,
          scheme,
          isPrimary: true,
        },
      })
    }
  }
}

export const onboardingAiRouter = router({
  getOnboardingState: orgProcedure.query(async ({ ctx }) => {
    assertCloudOnboardingAiEnabled()
    const snapshot = await loadSnapshot(ctx.organizationId)
    const requiredNow = getRequirementRules({
      countryCode: snapshot.values.countryCode,
      taxRegime: snapshot.values.taxRegime,
    }).requiredFields

    return {
      status: snapshot.cloudState.status,
      values: snapshot.values,
      missing: snapshot.readiness.missing,
      requiredNow,
    }
  }),

  getRequirementRules: orgProcedure
    .input(getRequirementRulesInputSchema)
    .query(({ input }) => {
      assertCloudOnboardingAiEnabled()
      return getRequirementRules(input)
    }),

  suggestOnboardingPatch: orgProcedure
    .input(suggestOnboardingPatchInputSchema)
    .mutation(async ({ ctx, input }) => {
      assertCloudOnboardingAiEnabled()
      const snapshot = await loadSnapshot(ctx.organizationId)
      const missing = toMissingFieldList(input.missing ?? snapshot.readiness.missing)
      const currentValues = {
        ...snapshot.values,
        ...input.currentValues,
      }
      const suggestion = await getOnboardingAiService().suggestPatch({
        userMessage: input.userMessage,
        currentValues,
        missing,
      })

      return onboardingAiSuggestionSchema.parse(suggestion)
    }),

  applyOnboardingPatch: orgProcedure
    .input(applyOnboardingPatchInputSchema)
    .mutation(async ({ ctx, input }) => {
      assertCloudOnboardingAiEnabled()
      await applyPatchToOrgSettings(ctx.organizationId, input.patch, input.source)
      const snapshot = await loadSnapshot(ctx.organizationId)
      return {
        values: snapshot.values,
        missing: snapshot.readiness.missing,
        isComplete: snapshot.readiness.isComplete,
      }
    }),

  validateOnboardingReadiness: orgProcedure
    .input(validateReadinessInputSchema)
    .query(({ input }) => {
      assertCloudOnboardingAiEnabled()
      const readiness = evaluateOnboardingReadiness({
        companyName: input.values.companyName ?? null,
        companyAddress: input.values.companyAddress ?? null,
        companyEmail: input.values.companyEmail ?? null,
        countryCode: input.values.countryCode ?? null,
        locale: input.values.locale ?? null,
        timezone: input.values.timezone ?? null,
        defaultCurrency: input.values.defaultCurrency ?? null,
        taxRegime: input.values.taxRegime ?? null,
        pricesIncludeTax: input.values.pricesIncludeTax ?? null,
        invoicePrefix: input.values.invoicePrefix ?? null,
        invoiceNextNum: input.values.invoiceNextNum ?? null,
        quotePrefix: input.values.quotePrefix ?? null,
        quoteNextNum: input.values.quoteNextNum ?? null,
        primaryTaxId: input.values.primaryTaxId ?? null,
      })

      return {
        isComplete: readiness.isComplete,
        missing: readiness.missing,
        blockingReasons: readiness.missing.map(
          (field) => `Missing required field: ${field}`
        ),
      }
    }),

  listFollowupQuestions: orgProcedure
    .input(listFollowupQuestionsInputSchema)
    .query(({ input }) => {
      assertCloudOnboardingAiEnabled()
      const rules = getRequirementRules({
        countryCode: input.values?.countryCode,
        taxRegime: input.values?.taxRegime,
      })
      const requiredMissing = toMissingFieldList(input.missing).filter((field) =>
        rules.requiredFields.includes(field)
      )

      return {
        questions: buildFollowupQuestions(requiredMissing),
      }
    }),
})
