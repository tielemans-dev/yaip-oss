import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { useI18n } from "../../../lib/i18n/react"

type EmailFinishStepProps = {
  locale: string
  countryCode: string
  timezone: string
  currency: string
  emailFromName: string
  emailReplyTo: string
  onLocaleChange: (value: string) => void
  onCountryCodeChange: (value: string) => void
  onTimezoneChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onEmailFromNameChange: (value: string) => void
  onEmailReplyToChange: (value: string) => void
}

export function EmailFinishStep({
  locale,
  countryCode,
  timezone,
  currency,
  emailFromName,
  emailReplyTo,
  onLocaleChange,
  onCountryCodeChange,
  onTimezoneChange,
  onCurrencyChange,
  onEmailFromNameChange,
  onEmailReplyToChange,
}: EmailFinishStepProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t("setup.step.finish.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.step.finish.description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="setup-locale">{t("setup.field.locale")}</Label>
          <Input
            id="setup-locale"
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value)}
            placeholder={t("setup.placeholder.locale")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-country">{t("setup.field.countryCode")}</Label>
          <Input
            id="setup-country"
            value={countryCode}
            onChange={(event) => onCountryCodeChange(event.target.value.toUpperCase())}
            placeholder={t("setup.placeholder.countryCode")}
            maxLength={2}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-timezone">{t("setup.field.timezone")}</Label>
          <Input
            id="setup-timezone"
            value={timezone}
            onChange={(event) => onTimezoneChange(event.target.value)}
            placeholder={t("setup.placeholder.timezone")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-currency">{t("setup.field.currency")}</Label>
          <Input
            id="setup-currency"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value.toUpperCase())}
            placeholder={t("setup.placeholder.currency")}
            maxLength={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-email-from">{t("setup.field.emailFromName")}</Label>
          <Input
            id="setup-email-from"
            value={emailFromName}
            onChange={(event) => onEmailFromNameChange(event.target.value)}
            placeholder={t("setup.placeholder.emailFromName")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-email-reply">{t("setup.field.emailReplyTo")}</Label>
          <Input
            id="setup-email-reply"
            value={emailReplyTo}
            onChange={(event) => onEmailReplyToChange(event.target.value)}
            placeholder={t("setup.placeholder.emailReplyTo")}
            type="email"
          />
        </div>
      </div>
    </div>
  )
}
