export type AIInvoiceDraftCapabilities = {
  enabled: boolean
  byok: boolean
  managed: boolean
  managedRequiresSubscription: boolean
  maxPromptChars: number
}

export type RuntimeCapabilities = {
  aiInvoiceDraft: AIInvoiceDraftCapabilities
}

export type RuntimeCapabilityPatch = {
  aiInvoiceDraft?: Partial<AIInvoiceDraftCapabilities>
}

export type RuntimeExtension = {
  id: string
  resolveCapabilities?: (
    baseCapabilities: Readonly<RuntimeCapabilities>
  ) => RuntimeCapabilityPatch | void
}

const DEFAULT_MAX_PROMPT_CHARS = 4000
let runtimeExtensions: RuntimeExtension[] = []

function readBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === "true") {
    return true
  }
  if (normalized === "false") {
    return false
  }
  return defaultValue
}

function mergeCapabilities(
  base: RuntimeCapabilities,
  patch: RuntimeCapabilityPatch | void
): RuntimeCapabilities {
  if (!patch) {
    return base
  }

  return {
    aiInvoiceDraft: {
      ...base.aiInvoiceDraft,
      ...patch.aiInvoiceDraft,
    },
  }
}

function readDefaultCapabilities(
  env: Record<string, string | undefined>
): RuntimeCapabilities {
  const byok = readBooleanFlag(env.YAIP_AI_BYOK_ENABLED, true)
  const managed = readBooleanFlag(env.YAIP_AI_MANAGED_ENABLED, false)

  return {
    aiInvoiceDraft: {
      enabled: byok || managed,
      byok,
      managed,
      managedRequiresSubscription: managed,
      maxPromptChars: DEFAULT_MAX_PROMPT_CHARS,
    },
  }
}

function uniqueExtensions(extensions: RuntimeExtension[]) {
  const seen = new Set<string>()
  const unique: RuntimeExtension[] = []

  for (const extension of extensions) {
    if (!extension.id || seen.has(extension.id)) {
      continue
    }
    seen.add(extension.id)
    unique.push(extension)
  }

  return unique
}

export function setRuntimeExtensions(extensions: RuntimeExtension[]) {
  runtimeExtensions = uniqueExtensions(extensions)
}

export function getRuntimeExtensions() {
  return [...runtimeExtensions]
}

export function getRuntimeCapabilities(
  env: Record<string, string | undefined> = process.env
) {
  let capabilities = readDefaultCapabilities(env)

  for (const extension of runtimeExtensions) {
    capabilities = mergeCapabilities(
      capabilities,
      extension.resolveCapabilities?.(capabilities)
    )
  }

  return capabilities
}
