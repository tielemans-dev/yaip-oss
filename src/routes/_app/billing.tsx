import { createFileRoute, useSearch } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { trpc } from "../../trpc/client"
import { billingEnabled } from "../../lib/distribution"
import { Button } from "../../components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card"
import { CreditCard } from "lucide-react"
import { useI18n } from "../../lib/i18n/react"

export const Route = createFileRoute("/_app/billing")({
  validateSearch: (search: Record<string, unknown>) => ({
    success: search.success === "true" ? true : undefined,
    canceled: search.canceled === "true" ? true : undefined,
  }),
  component: BillingPage,
})

type SubscriptionData = {
  status: string
  priceId: string | null
}

function BillingPage() {
  const { tm } = useI18n()
  const search = useSearch({ from: "/_app/billing" })
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!billingEnabled) {
      setLoading(false)
      return
    }
    trpc.billing.getSubscription
      .query()
      .then((data) => setSubscription(data))
      .catch(() =>
        setError(
          tm({
            en: "Failed to load subscription info",
            da: "Kunne ikke indlæse abonnementsoplysninger",
          })
        )
      )
      .finally(() => setLoading(false))
  }, [])

  if (!billingEnabled) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="size-6" />
          <h1 className="text-2xl font-bold">{tm({ en: "Billing", da: "Abonnement" })}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{tm({ en: "Self-host billing", da: "Self-host abonnement" })}</CardTitle>
            <CardDescription>
              {tm({
                en: "This OSS distribution does not include hosted billing. You can still create unlimited invoices and quotes.",
                da: "Denne OSS-distribution inkluderer ikke hosted abonnement. Du kan stadig oprette ubegrænsede fakturaer og tilbud.",
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  async function handleUpgrade() {
    setActionLoading(true)
    setError(null)
    try {
      const result = await trpc.billing.createCheckoutSession.mutate()
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({
              en: "Failed to create checkout session",
              da: "Kunne ikke oprette checkout-session",
            })
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleManage() {
    setActionLoading(true)
    setError(null)
    try {
      const result = await trpc.billing.createPortalSession.mutate()
      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({
              en: "Failed to open billing portal",
              da: "Kunne ikke åbne abonnementsportal",
            })
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="size-6" />
          <h1 className="text-2xl font-bold">{tm({ en: "Billing", da: "Abonnement" })}</h1>
        </div>
        <p className="text-muted-foreground">{tm({ en: "Loading...", da: "Indlæser..." })}</p>
      </div>
    )
  }

  const status = subscription?.status ?? "free"

  const statusLabels: Record<string, { label: string; className: string }> = {
    free: { label: tm({ en: "Free", da: "Gratis" }), className: "text-muted-foreground" },
    active: { label: tm({ en: "Active", da: "Aktiv" }), className: "text-green-600" },
    canceled: { label: tm({ en: "Canceled", da: "Opsagt" }), className: "text-orange-600" },
    past_due: { label: tm({ en: "Past Due", da: "Forfalden" }), className: "text-destructive" },
  }

  const statusInfo = statusLabels[status] ?? {
    label: status,
    className: "text-muted-foreground",
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="size-6" />
        <h1 className="text-2xl font-bold">{tm({ en: "Billing", da: "Abonnement" })}</h1>
      </div>

      {search.success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {tm({
            en: "Subscription activated successfully.",
            da: "Abonnement blev aktiveret.",
          })}
        </div>
      )}
      {search.canceled && (
        <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          {tm({ en: "Checkout was canceled.", da: "Checkout blev annulleret." })}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tm({ en: "Subscription", da: "Abonnement" })}</CardTitle>
          <CardDescription>
            {tm({
              en: "Manage your subscription and billing details.",
              da: "Administrer dit abonnement og betalingsoplysninger.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{tm({ en: "Current Plan", da: "Nuværende plan" })}</p>
              <p className={`text-lg font-semibold ${statusInfo.className}`}>
                {statusInfo.label}
              </p>
            </div>
          </div>

          {status === "free" && (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                {tm({
                  en: "Free plan is limited to 5 invoices per month. Upgrade to remove limits.",
                  da: "Gratisplanen er begrænset til 5 fakturaer pr. måned. Opgrader for at fjerne begrænsninger.",
                })}
              </p>
              <Button onClick={handleUpgrade} disabled={actionLoading}>
                {actionLoading
                  ? tm({ en: "Redirecting...", da: "Omdirigerer..." })
                  : tm({ en: "Upgrade", da: "Opgrader" })}
              </Button>
            </div>
          )}

          {status === "active" && (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                {tm({
                  en: "Your subscription is active. Manage your billing details, payment method, or cancel your subscription.",
                  da: "Dit abonnement er aktivt. Administrer betalingsoplysninger, betalingsmetode eller opsig abonnementet.",
                })}
              </p>
              <Button
                variant="outline"
                onClick={handleManage}
                disabled={actionLoading}
              >
                {actionLoading
                  ? tm({ en: "Redirecting...", da: "Omdirigerer..." })
                  : tm({ en: "Manage Subscription", da: "Administrer abonnement" })}
              </Button>
            </div>
          )}

          {status === "canceled" && (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                {tm({
                  en: "Your subscription has been canceled. Resubscribe to continue using premium features.",
                  da: "Dit abonnement er opsagt. Genaktiver for fortsat at bruge premium-funktioner.",
                })}
              </p>
              <Button onClick={handleUpgrade} disabled={actionLoading}>
                {actionLoading
                  ? tm({ en: "Redirecting...", da: "Omdirigerer..." })
                  : tm({ en: "Resubscribe", da: "Genaktiver abonnement" })}
              </Button>
            </div>
          )}

          {status === "past_due" && (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                {tm({
                  en: "Your payment is past due. Please update your payment method to keep your subscription active.",
                  da: "Din betaling er forfalden. Opdater din betalingsmetode for at holde abonnementet aktivt.",
                })}
              </p>
              <Button
                variant="outline"
                onClick={handleManage}
                disabled={actionLoading}
              >
                {actionLoading
                  ? tm({ en: "Redirecting...", da: "Omdirigerer..." })
                  : tm({ en: "Update Payment Method", da: "Opdater betalingsmetode" })}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
