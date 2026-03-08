import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "../../../generated/prisma/client"

import type { AuthHooks } from "./auth-config"
import type { RuntimePlatform } from "./platform"

declare global {
  var __prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured")
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

function getNodePrisma() {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient()
  }

  globalThis.__prisma ??= createPrismaClient()
  return globalThis.__prisma
}

const defaultAuthHooks: AuthHooks = {}

export const defaultNodePlatform: RuntimePlatform = {
  id: "oss-node",
  getRuntimeKind: () => "node",
  getEnv: (name) => process.env[name],
  getBinding: () => undefined,
  getPrisma: () => getNodePrisma(),
  getAuthHooks: () => defaultAuthHooks,
}
