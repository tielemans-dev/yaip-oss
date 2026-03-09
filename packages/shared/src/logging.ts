export type JsonLogLevel = "debug" | "info" | "warn" | "error"

export type JsonLogValue =
  | string
  | number
  | boolean
  | null
  | JsonLogValue[]
  | { [key: string]: JsonLogValue }

export type JsonLogEntry = {
  timestamp: string
  service: string
  level: JsonLogLevel
  event: string
  context?: string
  data?: JsonLogValue
}

export type JsonLogSink = (line: string, entry: JsonLogEntry) => void

export type JsonLogger = {
  debug: (event: string, data?: unknown) => JsonLogEntry
  info: (event: string, data?: unknown) => JsonLogEntry
  warn: (event: string, data?: unknown) => JsonLogEntry
  error: (event: string, data?: unknown) => JsonLogEntry
  child: (context: string) => JsonLogger
}

type CreateJsonLoggerOptions = {
  service: string
  sink?: JsonLogSink
  clock?: () => Date
  context?: string
}

function serializeLogValue(value: unknown): JsonLogValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(value.stack ? { stack: value.stack } : {}),
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeLogValue(item))
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeLogValue(item)])
    )
  }

  return String(value)
}

function defaultSink(line: string) {
  process.stdout.write(`${line}\n`)
}

export function createJsonLogger({
  service,
  sink = defaultSink,
  clock = () => new Date(),
  context,
}: CreateJsonLoggerOptions): JsonLogger {
  function write(level: JsonLogLevel, event: string, data?: unknown) {
    const entry: JsonLogEntry = {
      timestamp: clock().toISOString(),
      service,
      level,
      event,
      ...(context ? { context } : {}),
      ...(data === undefined ? {} : { data: serializeLogValue(data) }),
    }

    sink(JSON.stringify(entry), entry)
    return entry
  }

  return {
    debug(event, data) {
      return write("debug", event, data)
    },
    info(event, data) {
      return write("info", event, data)
    },
    warn(event, data) {
      return write("warn", event, data)
    },
    error(event, data) {
      return write("error", event, data)
    },
    child(childContext) {
      const nextContext = context ? `${context}.${childContext}` : childContext
      return createJsonLogger({
        service,
        sink,
        clock,
        context: nextContext,
      })
    },
  }
}
