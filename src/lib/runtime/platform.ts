export type RuntimeKind = "node" | "worker"

import type { AuthHooks } from "./auth-config"

export type RuntimePlatform = {
  id: string
  getRuntimeKind: () => RuntimeKind
  getEnv: (name: string) => string | undefined
  getBinding: <T>(name: string) => T | undefined
  getPrisma: () => unknown
  getAuthHooks: () => AuthHooks
}

let runtimePlatform: RuntimePlatform | undefined
const defaultAuthHooks: AuthHooks = {}
const defaultRuntimePlatform: RuntimePlatform = {
  id: "oss-node",
  getRuntimeKind: () => "node",
  getEnv: (name) => (typeof process !== "undefined" ? process.env[name] : undefined),
  getBinding: () => undefined,
  getPrisma: () => {
    throw new Error("Runtime platform prisma is not available in this environment")
  },
  getAuthHooks: () => defaultAuthHooks,
}

export function setRuntimePlatform(platform: RuntimePlatform) {
  runtimePlatform = platform
}

export function resetRuntimePlatform() {
  runtimePlatform = undefined
}

export function getRuntimePlatformOverride() {
  return runtimePlatform
}

export function getRuntimePlatform(): RuntimePlatform {
  return runtimePlatform ?? defaultRuntimePlatform
}

export function getRuntimeEnv() {
  const activePlatform = runtimePlatform ?? defaultRuntimePlatform

  return new Proxy({} as Record<string, string | undefined>, {
    get(_target, property) {
      return typeof property === "string"
        ? activePlatform.getEnv(property)
        : undefined
    },
  })
}
