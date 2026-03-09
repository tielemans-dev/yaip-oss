import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, orgProcedure } from "../init"
import { prisma } from "../../lib/db"
import {
  getCountryCodeOrFallback,
  validateLocalizedFields,
} from "../../lib/validation/localization"

const contactCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(120).optional(),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  zip: z.string().trim().max(20).optional(),
  country: z.string().trim().max(80).optional(),
  taxId: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(5000).optional(),
})

const contactUpdateSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(120).optional(),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  zip: z.string().trim().max(20).optional(),
  country: z.string().trim().max(80).optional(),
  taxId: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(5000).optional(),
})

function hasValidationIssues(issues: Record<string, string | undefined>) {
  return Object.values(issues).some(Boolean)
}

export const contactsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return prisma.contact.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
    })
  }),

  get: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.contact.findFirstOrThrow({
        where: { id: input.id, organizationId: ctx.organizationId },
      })
    }),

  create: orgProcedure
    .input(contactCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const settings = await prisma.orgSettings.findUnique({
        where: { organizationId: ctx.organizationId },
        select: { countryCode: true },
      })

      const resolvedCountry = getCountryCodeOrFallback(
        (input.country?.trim().length === 2 ? input.country : undefined) ||
          settings?.countryCode
      )
      const localizedIssues = validateLocalizedFields(resolvedCountry, {
        phone: input.phone,
        postalCode: input.zip,
        taxId: input.taxId,
      })

      if (hasValidationIssues(localizedIssues)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: Object.values(localizedIssues).filter(Boolean).join(" "),
        })
      }

      return prisma.contact.create({
        data: {
          ...input,
          email: input.email || null,
          country:
            input.country?.trim().length === 2
              ? input.country.toUpperCase()
              : input.country || null,
          organizationId: ctx.organizationId,
        },
      })
    }),

  update: orgProcedure
    .input(contactUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.contact.findFirstOrThrow({
        where: { id: input.id, organizationId: ctx.organizationId },
        select: { phone: true, zip: true, taxId: true, country: true },
      })
      const settings = await prisma.orgSettings.findUnique({
        where: { organizationId: ctx.organizationId },
        select: { countryCode: true },
      })

      const resolvedCountry = getCountryCodeOrFallback(
        (input.country?.trim().length === 2 ? input.country : undefined) ||
          (existing.country?.trim().length === 2 ? existing.country : undefined) ||
          settings?.countryCode
      )
      const localizedIssues = validateLocalizedFields(resolvedCountry, {
        phone: input.phone ?? existing.phone,
        postalCode: input.zip ?? existing.zip,
        taxId: input.taxId ?? existing.taxId,
      })

      if (hasValidationIssues(localizedIssues)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: Object.values(localizedIssues).filter(Boolean).join(" "),
        })
      }

      const { id, ...data } = input
      return prisma.contact.update({
        where: { id, organizationId: ctx.organizationId },
        data: {
          ...data,
          email: data.email || null,
          country:
            data.country?.trim().length === 2
              ? data.country.toUpperCase()
              : data.country,
        },
      })
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.contact.delete({
        where: { id: input.id, organizationId: ctx.organizationId },
      })
    }),
})
