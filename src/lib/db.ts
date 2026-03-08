import type { PrismaClient } from "../../generated/prisma/client"

import { createLiveBindingProxy } from "./runtime/live-binding"
import { defaultNodePlatform } from "./runtime/node-platform"
import { getRuntimePlatformOverride } from "./runtime/platform"

export function getPrisma() {
  return (getRuntimePlatformOverride() ?? defaultNodePlatform).getPrisma() as PrismaClient
}

export const prisma = createLiveBindingProxy<PrismaClient>(() => getPrisma())
