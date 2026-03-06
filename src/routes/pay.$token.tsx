import { createFileRoute } from "@tanstack/react-router"
import { useState, useTransition } from "react"
import {
  PublicInvoicePaymentPage,
  type PublicInvoicePaymentPageState,
} from "../components/invoices/public-invoice-payment-page"
import {
  beginPublicInvoiceCheckout,
  getPublicInvoiceSession,
} from "../lib/payments/public-session"

export const Route = createFileRoute("/pay/$token")({
  loader: async ({ params }) => {
    return getPublicInvoiceSession({
      data: {
        token: params.token,
      },
    })
  },
  component: PublicInvoicePaymentRoutePage,
})

function PublicInvoicePaymentRoutePage() {
  const { token } = Route.useParams()
  const initialState = Route.useLoaderData()
  const [state, setState] = useState<PublicInvoicePaymentPageState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePay() {
    setError(null)
    startTransition(() => {
      beginPublicInvoiceCheckout({
        data: {
          token,
        },
      })
        .then((result) => {
          if (result.url) {
            window.location.assign(result.url)
            return
          }

          if (result.status === "paid") {
            setState((current) =>
              current.kind === "ready"
                ? {
                    ...current,
                    paymentState: "paid",
                  }
                : current
            )
            return
          }

          if (result.status === "invalid") {
            setState({ kind: "invalid" })
            return
          }

          setError("Online payment is not available for this invoice.")
        })
        .catch(() => {
          setError("Unable to start payment right now. Please try again.")
        })
    })
  }

  return (
    <PublicInvoicePaymentPage
      token={token}
      state={state}
      onPay={handlePay}
      submitting={isPending}
      error={error}
    />
  )
}
