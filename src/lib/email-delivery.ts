export type EmailDeliveryOutcome = "sent" | "skipped" | "failed"

export type EmailDeliveryAttemptRecord = {
  lastEmailAttemptAt: Date
  lastEmailAttemptOutcome: EmailDeliveryOutcome
  lastEmailAttemptCode: string
  lastEmailAttemptMessage: string
}

export type EmailDeliveryAttemptSnapshot = {
  lastEmailAttemptAt: Date | null
  lastEmailAttemptOutcome: EmailDeliveryOutcome | null
  lastEmailAttemptCode: string | null
  lastEmailAttemptMessage: string | null
}

export function createEmailDeliveryAttempt(input: {
  at?: Date
  outcome: EmailDeliveryOutcome
  code: string
  message: string
}): EmailDeliveryAttemptRecord {
  return {
    lastEmailAttemptAt: input.at ?? new Date(),
    lastEmailAttemptOutcome: input.outcome,
    lastEmailAttemptCode: input.code,
    lastEmailAttemptMessage: input.message,
  }
}

export function readEmailDeliveryAttempt(
  input: EmailDeliveryAttemptSnapshot
): EmailDeliveryAttemptRecord | null {
  if (
    !input.lastEmailAttemptAt ||
    !input.lastEmailAttemptOutcome ||
    !input.lastEmailAttemptCode ||
    !input.lastEmailAttemptMessage
  ) {
    return null
  }

  return {
    lastEmailAttemptAt: input.lastEmailAttemptAt,
    lastEmailAttemptOutcome: input.lastEmailAttemptOutcome,
    lastEmailAttemptCode: input.lastEmailAttemptCode,
    lastEmailAttemptMessage: input.lastEmailAttemptMessage,
  }
}
