import type { PrismaClient } from "../../generated/prisma/client"

import { createLiveBindingProxy } from "./runtime/live-binding"
import { getRuntimePlatform } from "./runtime/platform"

export function getPrisma() {
  return getRuntimePlatform().getPrisma() as PrismaClient
}

export const prisma = createLiveBindingProxy<PrismaClient>(() => getPrisma())
