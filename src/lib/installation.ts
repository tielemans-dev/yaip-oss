import { createServerFn } from "@tanstack/react-start"
import type { InstallationStatus } from "./installation-state"

export const getInstallationStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<InstallationStatus> => {
    const { ensureInstallationState } = await import("./installation-state")
    const state = await ensureInstallationState()
    return {
      isSetupComplete: state.isSetupComplete,
      distribution: state.distribution,
      setupVersion: state.setupVersion,
    }
  }
)
