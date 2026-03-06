import { createHmac, timingSafeEqual } from "node:crypto"

export type InvoicePaymentState = "unpaid" | "paid"
export type InvoicePaymentScope = "invoice_payment"
export type InvoicePaymentTokenPayload = {
  invoiceId: string
  keyVersion: number
  scope: InvoicePaymentScope
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

function parseOrigin(value: string | undefined) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function getInvoicePaymentState(snapshot: {
  status: string
  paymentStatus: string
}): InvoicePaymentState {
  if (snapshot.paymentStatus === "paid" || snapshot.status === "paid") {
    return "paid"
  }

  return "unpaid"
}

export function signInvoicePaymentToken(
  payload: InvoicePaymentTokenPayload,
  secret: string
) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = signValue(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function verifyInvoicePaymentToken(
  token: string,
  secret: string
): InvoicePaymentTokenPayload | null {
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
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as InvoicePaymentTokenPayload
    if (
      typeof parsed.invoiceId !== "string" ||
      typeof parsed.keyVersion !== "number" ||
      parsed.scope !== "invoice_payment"
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function getPublicInvoicePaymentSecret() {
  const explicit = process.env.YAIP_PUBLIC_PAYMENT_SECRET?.trim()
  if (explicit && explicit.length >= 16) {
    return explicit
  }

  const fallback = process.env.BETTER_AUTH_SECRET?.trim()
  if (fallback && fallback.length >= 16) {
    return fallback
  }

  throw new Error("YAIP_PUBLIC_PAYMENT_SECRET or BETTER_AUTH_SECRET must be configured")
}

export function getPublicInvoicePaymentUrl(invoice: {
  id: string
  status: string
  paymentStatus: string
  publicPaymentIssuedAt: Date | null
  publicPaymentKeyVersion: number
}) {
  if (
    !invoice.publicPaymentIssuedAt ||
    getInvoicePaymentState(invoice) === "paid" ||
    (invoice.status !== "sent" && invoice.status !== "overdue" && invoice.status !== "paid")
  ) {
    return null
  }

  const origin =
    parseOrigin(process.env.YAIP_APP_ORIGIN) ??
    parseOrigin(process.env.BETTER_AUTH_URL) ??
    ""

  const token = signInvoicePaymentToken(
    {
      invoiceId: invoice.id,
      keyVersion: invoice.publicPaymentKeyVersion,
      scope: "invoice_payment",
    },
    getPublicInvoicePaymentSecret()
  )

  return `${origin}/pay/${encodeURIComponent(token)}`
}
