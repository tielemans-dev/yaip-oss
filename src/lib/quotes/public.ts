import { createHmac, timingSafeEqual } from "node:crypto"

export type QuotePublicDecision = "accepted" | "rejected"
export type QuotePublicDecisionState = "pending" | QuotePublicDecision
export type QuotePublicScope = "quote_public"

export type QuotePublicSnapshot = {
  status: string
  publicDecisionAt: Date | null
  publicRejectionReason?: string | null
}

export type QuotePublicTokenPayload = {
  quoteId: string
  keyVersion: number
  scope: QuotePublicScope
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

export function getQuotePublicDecisionState(
  snapshot: Pick<QuotePublicSnapshot, "status" | "publicDecisionAt">
): QuotePublicDecisionState {
  if (snapshot.status === "accepted") {
    return "accepted"
  }

  if (snapshot.status === "rejected") {
    return "rejected"
  }

  return "pending"
}

export function applyPublicQuoteDecision(
  snapshot: QuotePublicSnapshot,
  input: {
    decision: QuotePublicDecision
    decidedAt: Date
    rejectionReason?: string
  }
) {
  if (getQuotePublicDecisionState(snapshot) !== "pending") {
    throw new Error("Quote already has a customer decision")
  }

  return {
    ...snapshot,
    status: input.decision,
    publicDecisionAt: input.decidedAt,
    publicRejectionReason:
      input.decision === "rejected" ? input.rejectionReason?.trim() || null : null,
  }
}

export function assertQuoteCommercialFieldsMutable(
  snapshot: Pick<QuotePublicSnapshot, "status">
) {
  if (snapshot.status === "accepted") {
    throw new Error("Accepted quotes are locked")
  }
}

export function signQuotePublicToken(
  payload: QuotePublicTokenPayload,
  secret: string
) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = signValue(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function verifyQuotePublicToken(
  token: string,
  secret: string
): QuotePublicTokenPayload | null {
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signValue(encodedPayload, secret)
  const actual = Buffer.from(signature, "utf8")
  const expected = Buffer.from(expectedSignature, "utf8")

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as QuotePublicTokenPayload
    if (
      typeof parsed.quoteId !== "string" ||
      typeof parsed.keyVersion !== "number" ||
      parsed.scope !== "quote_public"
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}
