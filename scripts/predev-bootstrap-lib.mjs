const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"])

export function resolveDatabaseTarget(databaseUrl) {
  const value = databaseUrl?.trim()
  if (!value) {
    return { kind: "missing" }
  }

  try {
    const url = new URL(value)
    const host = (url.hostname || "").toLowerCase()

    if (LOCAL_DB_HOSTS.has(host)) {
      return { kind: "local", host }
    }

    return { kind: "remote", host }
  } catch {
    return { kind: "invalid" }
  }
}
