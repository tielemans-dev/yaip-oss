import { signQuotePublicToken } from "./public"

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

export function getPublicQuoteSecret() {
  const explicit = process.env.YAIP_PUBLIC_QUOTE_SECRET?.trim()
  if (explicit && explicit.length >= 16) {
    return explicit
  }

  const fallback = process.env.BETTER_AUTH_SECRET?.trim()
  if (fallback && fallback.length >= 16) {
    return fallback
  }

  throw new Error("YAIP_PUBLIC_QUOTE_SECRET or BETTER_AUTH_SECRET must be configured")
}

export function getPublicQuoteUrl(quote: {
  id: string
  status: string
  publicAccessIssuedAt: Date | null
  publicAccessKeyVersion: number
}) {
  if (
    !quote.publicAccessIssuedAt ||
    (quote.status !== "sent" && quote.status !== "accepted" && quote.status !== "rejected")
  ) {
    return null
  }

  const origin =
    parseOrigin(process.env.YAIP_APP_ORIGIN) ??
    parseOrigin(process.env.BETTER_AUTH_URL) ??
    ""

  const token = signQuotePublicToken(
    {
      quoteId: quote.id,
      keyVersion: quote.publicAccessKeyVersion,
      scope: "quote_public",
    },
    getPublicQuoteSecret()
  )

  return `${origin}/q/${encodeURIComponent(token)}`
}
