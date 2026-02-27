import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, orgProcedure } from "../init"
import { prisma } from "../../lib/db"
import { COUNTRY_OPTIONS, LOCALE_OPTIONS } from "../../lib/compliance/countries"
import {
  getCountryCodeOrFallback,
  validateLocalizedFields,
} from "../../lib/validation/localization"

const taxRegimeSchema = z.enum(["us_sales_tax", "eu_vat", "custom"])
const httpUrlRegex = /^https?:\/\/.+/i

const companyLogoSchema = z
  .string()
  .trim()
  .max(2_000_000)
  .refine(
    (value) => value.startsWith("data:image/") || httpUrlRegex.test(value),
    "Company logo must be an image URL or uploaded image data"
  )

const supportedCountryCodes = new Set(COUNTRY_OPTIONS.map((country) => country.code))
const supportedLocales = new Set(LOCALE_OPTIONS)

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value })
      return true
    } catch {
      return false
    }
  }, "Invalid time zone")

export const settingsUpdateSchema = z.object({
  currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
  taxRate: z.number().min(0).max(100).nullable().optional(),
  companyName: z.string().trim().max(120).optional(),
  companyAddress: z.string().trim().max(240).optional(),
  companyEmail: z.string().trim().email().optional(),
  companyPhone: z.string().trim().max(40).optional(),
  companyLogo: companyLogoSchema.nullable().optional(),
  invoicePrefix: z.string().trim().regex(/^[A-Z0-9-]{1,10}$/).optional(),
  quotePrefix: z.string().trim().regex(/^[A-Z0-9-]{1,10}$/).optional(),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .refine((value) => supportedCountryCodes.has(value), "Unsupported country")
    .optional(),
  locale: z
    .string()
    .trim()
    .refine((value) => supportedLocales.has(value), "Unsupported locale")
    .optional(),
  timezone: timezoneSchema.optional(),
  defaultCurrency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
  taxRegime: taxRegimeSchema.optional(),
  pricesIncludeTax: z.boolean().optional(),
  primaryTaxId: z.string().trim().max(40).optional(),
  primaryTaxIdScheme: z.string().trim().max(40).optional(),
})

export const settingsRouter = router({
  get: orgProcedure.query(async ({ ctx }) => {
    const primaryTaxId = await prisma.organizationTaxId.findFirst({
      where: { organizationId: ctx.organizationId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { value: true, scheme: true },
    })

    let settings = await prisma.orgSettings.findUnique({
      where: { organizationId: ctx.organizationId },
    })
    if (!settings) {
      settings = await prisma.orgSettings.create({
        data: { organizationId: ctx.organizationId },
      })
    }
    return {
      id: settings.id,
      countryCode: settings.countryCode,
      locale: settings.locale,
      timezone: settings.timezone,
      defaultCurrency: settings.defaultCurrency,
      taxRegime: settings.taxRegime,
      pricesIncludeTax: settings.pricesIncludeTax,
      currency: settings.currency,
      taxRate: settings.taxRate?.toNumber() ?? null,
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
      companyLogo: settings.companyLogo,
      invoicePrefix: settings.invoicePrefix,
      invoiceNextNum: settings.invoiceNextNum,
      quotePrefix: settings.quotePrefix,
      quoteNextNum: settings.quoteNextNum,
      primaryTaxId: primaryTaxId?.value ?? null,
      primaryTaxIdScheme: primaryTaxId?.scheme ?? null,
    }
  }),

  update: orgProcedure
    .input(settingsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { primaryTaxId, primaryTaxIdScheme, ...settingsInput } = input

      return prisma.$transaction(async (tx) => {
        const current = await tx.orgSettings.findUnique({
          where: { organizationId: ctx.organizationId },
          select: { countryCode: true },
        })
        const resolvedCountry = getCountryCodeOrFallback(
          settingsInput.countryCode ?? current?.countryCode
        )
        const localizedIssues = validateLocalizedFields(resolvedCountry, {
          phone: settingsInput.companyPhone,
          taxId: primaryTaxId,
        })
        if (Object.values(localizedIssues).some(Boolean)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: Object.values(localizedIssues).filter(Boolean).join(" "),
          })
        }

        const settings = await tx.orgSettings.upsert({
          where: { organizationId: ctx.organizationId },
          update: settingsInput,
          create: { organizationId: ctx.organizationId, ...settingsInput },
        })

        if (primaryTaxId && primaryTaxId.trim()) {
          const existing = await tx.organizationTaxId.findFirst({
            where: { organizationId: ctx.organizationId },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            select: { id: true },
          })

          if (existing) {
            await tx.organizationTaxId.update({
              where: { id: existing.id },
              data: {
                value: primaryTaxId.trim(),
                scheme: primaryTaxIdScheme?.trim() || "vat",
                isPrimary: true,
              },
            })
          } else {
            await tx.organizationTaxId.create({
              data: {
                organizationId: ctx.organizationId,
                value: primaryTaxId.trim(),
                scheme: primaryTaxIdScheme?.trim() || "vat",
                isPrimary: true,
              },
            })
          }
        }

        return settings
      })
    }),
})
