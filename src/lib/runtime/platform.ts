export type RuntimeKind = "node" | "worker"

import { defaultNodePlatform } from "./node-platform"

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

export function setRuntimePlatform(platform: RuntimePlatform) {
  runtimePlatform = platform
}

export function resetRuntimePlatform() {
  runtimePlatform = undefined
}

export function getRuntimePlatform(): RuntimePlatform {
  return runtimePlatform ?? defaultNodePlatform
}

export function getRuntimeEnv() {
  return new Proxy({} as Record<string, string | undefined>, {
    get(_target, property) {
      return typeof property === "string"
        ? getRuntimePlatform().getEnv(property)
        : undefined
    },
  })
}
