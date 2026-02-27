export function isSetupGuardBypassPath(pathname: string) {
  return (
    pathname === "/setup" ||
    pathname.startsWith("/setup/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/accept-invitation" ||
    pathname.startsWith("/accept-invitation/") ||
    pathname.startsWith("/api/") ||
    pathname === "/health" ||
    pathname === "/healthz"
  )
}

export function shouldRedirectToSetup(pathname: string, isSetupComplete: boolean) {
  if (isSetupComplete) {
    return false
  }
  return !isSetupGuardBypassPath(pathname)
}
