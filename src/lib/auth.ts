import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { prisma } from "./db"
import { ac, admin, member, accountant } from "./permissions"
import { sendInvitationEmail } from "./email"
import { getConfiguredSocialProviders } from "./auth/providers"

const socialProviders = getConfiguredSocialProviders()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
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
