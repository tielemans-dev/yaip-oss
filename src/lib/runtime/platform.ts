export type RuntimeKind = "node" | "worker"

export type RuntimeAuthHooks = Record<string, unknown>

export type RuntimePlatform = {
  id: string
  getRuntimeKind: () => RuntimeKind
  getEnv: (name: string) => string | undefined
  getBinding: <T>(name: string) => T | undefined
  getPrisma: () => unknown
  getAuthHooks: () => RuntimeAuthHooks
}

const defaultNodePlatform: RuntimePlatform = {
  id: "oss-node",
  getRuntimeKind: () => "node",
  getEnv: (name) => process.env[name],
  getBinding: () => undefined,
  getPrisma: () => {
    throw new Error("Default runtime platform does not provide a Prisma client yet")
  },
  getAuthHooks: () => ({}),
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
