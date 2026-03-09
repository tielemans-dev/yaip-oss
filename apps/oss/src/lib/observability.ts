import { createJsonLogger } from "@yaip/shared/logging"
import { readBooleanEnv } from "@yaip/shared/runtimeEnv"

const isTestEnv =
  process.env.VITEST === "true" || process.env.NODE_ENV?.trim().toLowerCase() === "test"
const structuredLogsEnabled = readBooleanEnv(process.env.YAIP_JSON_LOGS, !isTestEnv)

export const appLogger = createJsonLogger({
  service: "@yaip/oss",
  sink(line) {
    if (!structuredLogsEnabled) {
      return
    }

    process.stdout.write(`${line}\n`)
  },
})
