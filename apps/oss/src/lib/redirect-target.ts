export function normalizeHostedNext(
  next: string | undefined,
  appOrigin: string
): string {
  const fallback = `${appOrigin.replace(/\/$/, "")}/`
  if (!next) return fallback

  try {
    const parsed = new URL(next)
    const allowed = new URL(appOrigin)
    if (parsed.origin !== allowed.origin) return fallback
    return parsed.toString()
  } catch {
    return fallback
  }
}
