export type HostedRuntimeConfig = {
  hostedMode: boolean
  shellOrigin: string
  appOrigin: string
}

export function getHostedRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env
): HostedRuntimeConfig {
  const hostedMode = String(env.HOSTED_MODE).toLowerCase() === "true"

  return {
    hostedMode,
    shellOrigin: env.HOSTED_SHELL_ORIGIN?.trim() || "",
    appOrigin: env.HOSTED_APP_ORIGIN?.trim() || "",
  }
}
