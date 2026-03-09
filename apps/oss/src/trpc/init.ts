import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { auth } from "../lib/auth"
import { isCloudDistribution } from "../lib/distribution"

export type Context = {
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const setupProcedure = publicProcedure.use(async ({ next }) => {
  if (isCloudDistribution) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Installation setup is disabled in cloud distribution",
    })
  }

  return next()
})

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      organizationId: ctx.session.session.activeOrganizationId,
    },
  })
})

export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.organizationId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization selected",
    })
  }
  return next({
    ctx: {
      ...ctx,
      organizationId: ctx.organizationId,
    },
  })
})
