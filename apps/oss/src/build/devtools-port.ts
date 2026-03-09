const DEFAULT_DEVTOOLS_EVENT_BUS_PORT = 42069
const DEVTOOLS_EVENT_BUS_PORT_SPAN = 1000

function hashProjectRoot(input: string) {
  let hash = 0

  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) % DEVTOOLS_EVENT_BUS_PORT_SPAN
  }

  return hash
}

export function resolveDevtoolsEventBusPort(input: {
  configuredPort?: string
  projectRoot: string
}) {
  const configuredPort = Number(input.configuredPort)

  if (
    Number.isInteger(configuredPort) &&
    configuredPort > 0 &&
    configuredPort <= 65_535
  ) {
    return configuredPort
  }

  return DEFAULT_DEVTOOLS_EVENT_BUS_PORT + hashProjectRoot(input.projectRoot)
}
