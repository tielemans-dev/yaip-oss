import { createServerFn } from "@tanstack/react-start"
import type { InstallationStatus } from "./installation-state"
import { isCloudDistribution } from "./distribution"

export const getInstallationStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<InstallationStatus> => {
    const { ensureInstallationState } = await import("./installation-state")
    const state = await ensureInstallationState()

    // In hosted cloud mode, setup state is org-scoped rather than installation-scoped.
    const distribution = isCloudDistribution ? "cloud" : "selfhost"

    return {
      isSetupComplete: state.isSetupComplete,
      distribution,
      setupVersion: state.setupVersion,
    }
  }
)
