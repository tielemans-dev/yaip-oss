import type { EmailDeliveryRuntimeStatus } from "../../lib/email-delivery"
import { useI18n } from "../../lib/i18n/react"
import { Badge } from "../ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"

const statusClassNames: Record<EmailDeliveryRuntimeStatus["status"], string> = {
  configured: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  missing_configuration:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  managed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  managed_unavailable:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

export function EmailDeliveryCard({
  emailDelivery,
}: {
  emailDelivery: EmailDeliveryRuntimeStatus
}) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t("settings.section.emailDelivery.title")}</CardTitle>
            <CardDescription>
              {t("settings.section.emailDelivery.description")}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={statusClassNames[emailDelivery.status]}
          >
            {t(`settings.emailDelivery.status.${emailDelivery.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1">
          <div className="text-sm font-medium">
            {t("settings.emailDelivery.sender.label")}
          </div>
          <div className="text-sm text-muted-foreground">{emailDelivery.sender}</div>
        </div>

        {emailDelivery.missing.length > 0 && (
          <div className="grid gap-1">
            <div className="text-sm font-medium">
              {t("settings.emailDelivery.missing.label")}
            </div>
            <div className="text-sm text-muted-foreground">
              {emailDelivery.missing.join(", ")}
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {t(`settings.emailDelivery.help.${emailDelivery.status}`)}
        </p>
      </CardContent>
    </Card>
  )
}
