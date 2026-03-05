import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { prisma } from "./db"
import { ac, admin, member, accountant } from "./permissions"
import { sendInvitationEmail } from "./email"
import { getConfiguredSocialProviders } from "./auth/providers"

const socialProviders = getConfiguredSocialProviders()
const distribution = (process.env.YAIP_DISTRIBUTION ?? "selfhost").trim().toLowerCase()
const cloudDistribution = distribution === "cloud"

function parseOrigin(value: string | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const trustedOrigins = Array.from(
  new Set(
    [
      parseOrigin(process.env.BETTER_AUTH_URL),
      parseOrigin(process.env.YAIP_SHELL_ORIGIN),
      parseOrigin(process.env.YAIP_APP_ORIGIN),
    ].filter((origin): origin is string => Boolean(origin))
  )
)

const crossSubDomainEnabled =
  process.env.YAIP_AUTH_CROSS_SUBDOMAIN?.trim().toLowerCase() === "true" ||
  cloudDistribution
const crossSubDomainDomain = process.env.YAIP_AUTH_COOKIE_DOMAIN?.trim()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  ...(trustedOrigins.length > 0 ? { trustedOrigins } : {}),
  ...(crossSubDomainEnabled
    ? {
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            ...(crossSubDomainDomain ? { domain: crossSubDomainDomain } : {}),
          },
        },
      }
    : {}),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: Object.keys(socialProviders).length
    ? socialProviders
    : undefined,
  plugins: [
    organization({
      ac,
      roles: { admin, member, accountant },
      allowUserToCreateOrganization: true,
      creatorRole: "admin",
      membershipLimit: 50,
      async sendInvitationEmail(data) {
        if (!process.env.RESEND_API_KEY) return
        const invitationUrl = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`
        const orgSettings = await prisma.orgSettings.findUnique({
          where: { organizationId: data.organization.id },
          select: { locale: true },
        })
        await sendInvitationEmail({
          to: data.email,
          inviterName: data.inviter.user.name,
          orgName: data.organization.name,
          invitationUrl,
          locale: orgSettings?.locale,
        })
      },
    }),
    tanstackStartCookies(),
  ],
})
