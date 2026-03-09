import { resolveUrlOrigin } from "./runtimeEnv"

export function resolveAppOrigin(
  candidates: Array<string | undefined>,
  fallbackOrigin = ""
) {
  for (const candidate of candidates) {
    const resolved = resolveUrlOrigin(candidate)
    if (resolved) {
      return resolved
    }
  }

  return resolveUrlOrigin(fallbackOrigin) ?? fallbackOrigin
}

export function buildAbsoluteUrl(origin: string, pathname: string) {
  if (!origin) {
    return pathname
  }

  return new URL(pathname, `${origin}/`).toString()
}
