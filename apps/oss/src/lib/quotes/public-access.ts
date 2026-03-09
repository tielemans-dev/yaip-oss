import { prisma } from "../db"
import {
  applyPublicQuoteDecision,
  getQuotePublicDecisionState,
  type QuotePublicDecision,
  verifyQuotePublicToken,
} from "./public"

export async function loadPublicQuoteByToken(token: string, secret: string) {
  const payload = verifyQuotePublicToken(token, secret)
  if (!payload) {
    return null
  }

  const quote = await prisma.quote.findFirst({
    where: {
      id: payload.quoteId,
      publicAccessKeyVersion: payload.keyVersion,
      publicAccessIssuedAt: {
        not: null,
      },
      status: {
        in: ["sent", "accepted", "rejected"],
      },
    },
    include: {
      contact: {
        select: {
          name: true,
          email: true,
          company: true,
        },
      },
      items: {
        orderBy: { sortOrder: "asc" },
      },
      invoices: {
        select: { id: true, number: true, status: true },
      },
    },
  })

  if (!quote) {
    return null
  }

  return {
    quote,
    decisionState: getQuotePublicDecisionState({
      status: quote.status,
      publicDecisionAt: quote.publicDecisionAt,
    }),
  }
}

export async function decidePublicQuoteByToken(
  token: string,
  secret: string,
  input: {
    decision: QuotePublicDecision
    rejectionReason?: string
  }
) {
  const payload = verifyQuotePublicToken(token, secret)
  if (!payload) {
    throw new Error("Invalid public quote link")
  }

  const decidedAt = new Date()

  const quote = await prisma.$transaction(async (tx) => {
    const current = await tx.quote.findFirstOrThrow({
      where: {
        id: payload.quoteId,
        publicAccessKeyVersion: payload.keyVersion,
        publicAccessIssuedAt: {
          not: null,
        },
        status: {
          in: ["sent", "accepted", "rejected"],
        },
      },
    })

    const next = applyPublicQuoteDecision(
      {
        status: current.status,
        publicDecisionAt: current.publicDecisionAt,
        publicRejectionReason: current.publicRejectionReason,
      },
      {
        decision: input.decision,
        decidedAt,
        rejectionReason: input.rejectionReason,
      }
    )

    return tx.quote.update({
      where: { id: current.id },
      data: {
        status: next.status,
        publicDecisionAt: next.publicDecisionAt,
        publicRejectionReason: next.publicRejectionReason,
      },
      include: {
        contact: {
          select: {
            name: true,
            email: true,
            company: true,
          },
        },
        items: {
          orderBy: { sortOrder: "asc" },
        },
        invoices: {
          select: { id: true, number: true, status: true },
        },
      },
    })
  })

  return {
    quote,
    decisionState: getQuotePublicDecisionState({
      status: quote.status,
      publicDecisionAt: quote.publicDecisionAt,
    }),
  }
}
