import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { trpc } from "../../trpc/client"
import { authClient, useSession } from "../../lib/auth-client"
import { validateSettingsFormInput } from "../../lib/validation/settings-form"
import {
  COUNTRY_OPTIONS,
  LOCALE_OPTIONS,
  TAX_REGIMES,
} from "../../lib/compliance/countries"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"
import { Settings, UserPlus, X, Crown, User, Eye } from "lucide-react"
import { useI18n } from "../../lib/i18n/react"

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
})

type OrgMember = {
  id: string
  role: string
  user: { id: string; name: string; email: string; image?: string | null }
}

type OrgInvitation = {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
}

const ROLE_CONFIG: Record<string, { key: "admin" | "member" | "accountant"; icon: typeof User }> = {
  admin: { key: "admin", icon: Crown },
  member: { key: "member", icon: User },
  accountant: { key: "accountant", icon: Eye },
}

function RoleBadge({
  role,
  tm,
}: {
  role: string
  tm: (messages: { en: string } & Record<string, string | undefined>) => string
}) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.member
  const Icon = config.icon
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="size-3" />
      {config.key === "admin"
        ? tm({ en: "Admin", da: "Admin" })
        : config.key === "accountant"
          ? tm({ en: "Accountant", da: "Bogholder" })
          : tm({ en: "Member", da: "Medlem" })}
    </Badge>
  )
}

type SettingsData = {
  id: string
  countryCode: string
  locale: string
  timezone: string
  defaultCurrency: string
  taxRegime: "us_sales_tax" | "eu_vat" | "custom"
  pricesIncludeTax: boolean
  currency: string
  taxRate: number | null
  companyName: string | null
  companyAddress: string | null
  companyEmail: string | null
  companyPhone: string | null
  companyLogo: string | null
  invoicePrefix: string
  invoiceNextNum: number
  quotePrefix: string
  quoteNextNum: number
  aiByokConfigured: boolean
  aiOpenRouterModel: string
  primaryTaxId: string | null
  primaryTaxIdScheme: string | null
}

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "DKK", label: "DKK - Danish Krone" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
]

const OPENROUTER_FALLBACK_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4.1-mini",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-2.0-flash-001",
]

const LOGO_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
const LOGO_FILE_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml"
const HTTP_URL_REGEX = /^https?:\/\/.+/i

function isDataImageLogo(value: string) {
  return value.startsWith("data:image/")
}

function isHttpLogoUrl(value: string) {
  return HTTP_URL_REGEX.test(value)
}

function SettingsPage() {
  const { tm } = useI18n()
  const { data: session } = useSession()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [countryCode, setCountryCode] = useState("US")
  const [locale, setLocale] = useState("en-US")
  const [timezone, setTimezone] = useState("UTC")
  const [defaultCurrency, setDefaultCurrency] = useState("USD")
  const [taxRegime, setTaxRegime] = useState<"us_sales_tax" | "eu_vat" | "custom">("us_sales_tax")
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false)
  const [primaryTaxId, setPrimaryTaxId] = useState("")
  const [primaryTaxIdScheme, setPrimaryTaxIdScheme] = useState("vat")
  const [companyLogo, setCompanyLogo] = useState("")
  const [companyLogoUrlInput, setCompanyLogoUrlInput] = useState("")
  const [logoError, setLogoError] = useState<string | null>(null)
  const [aiOpenRouterModel, setAiOpenRouterModel] = useState("openai/gpt-4o-mini")
  const [clearAiOpenRouterApiKey, setClearAiOpenRouterApiKey] = useState(false)
  const [openRouterModels, setOpenRouterModels] = useState<string[]>(OPENROUTER_FALLBACK_MODELS)
  const [loadingOpenRouterModels, setLoadingOpenRouterModels] = useState(false)
  const [openRouterModelsError, setOpenRouterModelsError] = useState<string | null>(null)

  // Team members state
  const [members, setMembers] = useState<OrgMember[]>([])
  const [invitations, setInvitations] = useState<OrgInvitation[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const countryDisplayNames = useMemo(
    () => new Intl.DisplayNames([locale || "en-US"], { type: "region" }),
    [locale]
  )
  const currencyDisplayNames = useMemo(
    () => new Intl.DisplayNames([locale || "en-US"], { type: "currency" }),
    [locale]
  )
  const languageDisplayNames = useMemo(
    () => new Intl.DisplayNames([locale || "en-US"], { type: "language" }),
    [locale]
  )

  useEffect(() => {
    trpc.settings.get
      .query()
      .then((data) => {
        setSettings(data as SettingsData)
        setCountryCode(data.countryCode)
        setLocale(data.locale)
        setTimezone(data.timezone)
        setDefaultCurrency(data.defaultCurrency || data.currency)
        setTaxRegime(data.taxRegime)
        setPricesIncludeTax(data.pricesIncludeTax)
        setPrimaryTaxId(data.primaryTaxId ?? "")
        setPrimaryTaxIdScheme(data.primaryTaxIdScheme ?? "vat")
        const existingLogo = data.companyLogo ?? ""
        setCompanyLogo(existingLogo)
        setCompanyLogoUrlInput(isDataImageLogo(existingLogo) ? "" : existingLogo)
        setAiOpenRouterModel(data.aiOpenRouterModel || "openai/gpt-4o-mini")
      })
      .catch(() =>
        setError(tm({ en: "Failed to load settings", da: "Kunne ikke indlæse indstillinger" }))
      )
      .finally(() => setLoading(false))
  }, [])

  async function loadOpenRouterModels() {
    setLoadingOpenRouterModels(true)
    setOpenRouterModelsError(null)
    try {
      const result = await trpc.ai.listModels.query()
      if (result.models.length > 0) {
        setOpenRouterModels(result.models)
      }
    } catch {
      setOpenRouterModelsError(
        tm({
          en: "Could not load model list from OpenRouter. Using fallback list.",
          da: "Kunne ikke hente modellisten fra OpenRouter. Bruger fallback-liste.",
        })
      )
    } finally {
      setLoadingOpenRouterModels(false)
    }
  }

  useEffect(() => {
    loadOpenRouterModels()
  }, [])

  useEffect(() => {
    async function loadTeam() {
      const org = await authClient.organization.getFullOrganization()
      if (org.data) {
        setMembers((org.data.members ?? []) as OrgMember[])
        setInvitations(
          ((org.data.invitations ?? []) as OrgInvitation[]).filter(
            (i) => i.status === "pending"
          )
        )
      }
      setTeamLoading(false)
    }
    loadTeam()
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviting(true)
    const result = await authClient.organization.inviteMember({
      email: inviteEmail,
      role: inviteRole as "member" | "admin" | "accountant",
    })
    if (result.error) {
      setInviteError(
        result.error.message ??
          tm({ en: "Failed to send invite", da: "Kunne ikke sende invitation" })
      )
    } else if (result.data) {
      setInvitations((prev) => [...prev, result.data as OrgInvitation])
      setInviteEmail("")
    }
    setInviting(false)
  }

  async function handleRemoveMember(memberId: string) {
    await authClient.organization.removeMember({ memberIdOrEmail: memberId })
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  async function handleCancelInvite(invitationId: string) {
    await authClient.organization.cancelInvitation({ invitationId })
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const form = new FormData(e.currentTarget)
    const timezoneInput = ((form.get("timezone") as string) || timezone).trim() || "UTC"
    const taxRateRaw = ((form.get("taxRate") as string) || "").trim()
    const companyNameInput = ((form.get("companyName") as string) || "").trim()
    const companyAddressInput = ((form.get("companyAddress") as string) || "").trim()
    const companyEmailInput = ((form.get("companyEmail") as string) || "").trim()
    const companyPhoneInput = ((form.get("companyPhone") as string) || "").trim()
    const invoicePrefixInput = ((form.get("invoicePrefix") as string) || "").trim()
    const quotePrefixInput = ((form.get("quotePrefix") as string) || "").trim()
    const aiOpenRouterModelInput = aiOpenRouterModel.trim()
    const aiOpenRouterApiKeyInput = ((form.get("aiOpenRouterApiKey") as string) || "").trim()
    const normalizedCompanyLogo = companyLogo.trim()

    if (
      normalizedCompanyLogo &&
      !isDataImageLogo(normalizedCompanyLogo) &&
      !isHttpLogoUrl(normalizedCompanyLogo)
    ) {
      setSaving(false)
      setError(
        tm({
          en: "Company logo must be an image URL or uploaded image data.",
          da: "Virksomhedslogo skal være en billed-URL eller uploadet billeddata.",
        })
      )
      return
    }

    const formValidationError = validateSettingsFormInput({
      timezone: timezoneInput,
      taxRateRaw,
      companyEmail: companyEmailInput,
      companyPhone: companyPhoneInput,
      invoicePrefix: invoicePrefixInput,
      quotePrefix: quotePrefixInput,
    })

    if (formValidationError) {
      setSaving(false)
      setError(
        formValidationError === "invalid_timezone"
          ? tm({ en: "Please enter a valid IANA time zone (e.g. Europe/Copenhagen).", da: "Angiv en gyldig IANA-tidszone (f.eks. Europe/Copenhagen)." })
          : formValidationError === "invalid_tax_rate"
            ? tm({ en: "Tax rate must be a number between 0 and 100.", da: "Momssatsen skal være et tal mellem 0 og 100." })
            : formValidationError === "invalid_company_email"
              ? tm({ en: "Please enter a valid company email address.", da: "Angiv en gyldig virksomheds-e-mailadresse." })
              : formValidationError === "invalid_company_phone"
                ? tm({ en: "Please enter a valid company phone number.", da: "Angiv et gyldigt virksomhedsnummer." })
                : formValidationError === "invalid_invoice_prefix"
                  ? tm({ en: "Invoice prefix must be 1-10 uppercase letters, numbers, or hyphens.", da: "Fakturapræfikset skal være 1-10 store bogstaver, tal eller bindestreger." })
                  : tm({ en: "Quote prefix must be 1-10 uppercase letters, numbers, or hyphens.", da: "Tilbudspræfikset skal være 1-10 store bogstaver, tal eller bindestreger." })
      )
      return
    }

    try {
      await trpc.settings.update.mutate({
        countryCode,
        locale,
        timezone: timezoneInput,
        defaultCurrency,
        taxRegime,
        pricesIncludeTax,
        primaryTaxId: primaryTaxId || undefined,
        primaryTaxIdScheme,
        currency: defaultCurrency,
        taxRate: taxRateRaw ? parseFloat(taxRateRaw) : null,
        companyName: companyNameInput || undefined,
        companyAddress: companyAddressInput || undefined,
        companyEmail: companyEmailInput || undefined,
        companyPhone: companyPhoneInput || undefined,
        companyLogo: normalizedCompanyLogo || null,
        invoicePrefix: invoicePrefixInput || undefined,
        quotePrefix: quotePrefixInput || undefined,
        aiOpenRouterModel: aiOpenRouterModelInput || undefined,
        aiOpenRouterApiKey: aiOpenRouterApiKeyInput || undefined,
        clearAiOpenRouterApiKey,
      })
      setTimezone(timezoneInput)
      setClearAiOpenRouterApiKey(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tm({ en: "Failed to save settings", da: "Kunne ikke gemme indstillinger" })
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setLogoError(null)
    setError(null)

    if (!file.type.startsWith("image/")) {
      setLogoError(tm({ en: "Only image files are supported.", da: "Kun billedfiler understøttes." }))
      event.target.value = ""
      return
    }

    if (file.size > LOGO_MAX_FILE_SIZE_BYTES) {
      setLogoError(
        tm({ en: "Logo file must be 2 MB or smaller.", da: "Logofil skal være 2 MB eller mindre." })
      )
      event.target.value = ""
      return
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ""))
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      })
      setCompanyLogo(dataUrl)
      setCompanyLogoUrlInput("")
    } catch {
      setLogoError(tm({ en: "Failed to read logo file.", da: "Kunne ikke læse logofil." }))
    } finally {
      event.target.value = ""
    }
  }

  function handleCompanyLogoUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value
    setCompanyLogoUrlInput(nextValue)
    setLogoError(null)
    const trimmed = nextValue.trim()
    if (trimmed) {
      setCompanyLogo(trimmed)
      return
    }
    if (!isDataImageLogo(companyLogo)) {
      setCompanyLogo("")
    }
  }

  function clearCompanyLogo() {
    setCompanyLogo("")
    setCompanyLogoUrlInput("")
    setLogoError(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="size-6" />
          <h1 className="text-2xl font-bold">{tm({ en: "Settings", da: "Indstillinger" })}</h1>
        </div>
        <p className="text-muted-foreground">{tm({ en: "Loading...", da: "Indlæser..." })}</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="size-6" />
          <h1 className="text-2xl font-bold">{tm({ en: "Settings", da: "Indstillinger" })}</h1>
        </div>
        <p className="text-destructive">
          {error ?? tm({ en: "Failed to load settings", da: "Kunne ikke indlæse indstillinger" })}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="size-6" />
        <h1 className="text-2xl font-bold">{tm({ en: "Settings", da: "Indstillinger" })}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600" role="status">
            {tm({ en: "Settings saved successfully.", da: "Indstillinger gemt." })}
          </p>
        )}

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>{tm({ en: "Company Information", da: "Virksomhedsoplysninger" })}</CardTitle>
            <CardDescription>
              {tm({
                en: "Your company details appear on invoices and quotes.",
                da: "Dine virksomhedsoplysninger vises på fakturaer og tilbud.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">{tm({ en: "Company Name", da: "Virksomhedsnavn" })}</Label>
              <Input
                id="companyName"
                name="companyName"
                maxLength={120}
                placeholder={tm({ en: "Acme Inc.", da: "Acme ApS" })}
                defaultValue={settings.companyName ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyAddress">{tm({ en: "Company Address", da: "Virksomhedsadresse" })}</Label>
              <Textarea
                id="companyAddress"
                name="companyAddress"
                placeholder={tm({ en: "123 Main St&#10;City, State 12345", da: "Hovedgade 123&#10;By, Region 1234" })}
                rows={3}
                maxLength={240}
                defaultValue={settings.companyAddress ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="companyEmail">{tm({ en: "Company Email", da: "Virksomheds-e-mail" })}</Label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  maxLength={254}
                  placeholder={tm({ en: "billing@acme.com", da: "faktura@acme.dk" })}
                  defaultValue={settings.companyEmail ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyPhone">{tm({ en: "Company Phone", da: "Virksomhedstelefon" })}</Label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  maxLength={40}
                  pattern="^\+?[0-9()\-\s.]{6,20}$"
                  title={tm({ en: "Enter a valid phone number", da: "Indtast et gyldigt telefonnummer" })}
                  placeholder={tm({ en: "+1 555 123 4567", da: "+45 12 34 56 78" })}
                  defaultValue={settings.companyPhone ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyLogoUrl">{tm({ en: "Company Logo", da: "Virksomhedslogo" })}</Label>
              <Input
                id="companyLogoUrl"
                type="url"
                maxLength={2000}
                placeholder={tm({ en: "https://example.com/logo.png", da: "https://example.com/logo.png" })}
                value={companyLogoUrlInput}
                onChange={handleCompanyLogoUrlChange}
              />
              <p className="text-xs text-muted-foreground">
                {tm({
                  en: "Paste a logo image URL or upload a file.",
                  da: "Indsæt en billed-URL til logo eller upload en fil.",
                })}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept={LOGO_FILE_ACCEPT}
                  onChange={handleLogoFileChange}
                  className="block w-full max-w-sm text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                />
                {companyLogo && (
                  <Button type="button" variant="outline" size="sm" onClick={clearCompanyLogo}>
                    {tm({ en: "Remove logo", da: "Fjern logo" })}
                  </Button>
                )}
              </div>
              {logoError && <p className="text-xs text-destructive">{logoError}</p>}
              {companyLogo && (
                <div className="rounded-md border bg-muted/20 p-3">
                  <img
                    src={companyLogo}
                    alt={tm({ en: "Company logo preview", da: "Forhåndsvisning af virksomhedslogo" })}
                    className="h-14 w-auto max-w-52 object-contain"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>{tm({ en: "Localization & Compliance", da: "Lokalisering og compliance" })}</CardTitle>
            <CardDescription>
              {tm({
                en: "Country, locale, and tax regime defaults used across invoices and quotes.",
                da: "Standarder for land, sprog og skatteregime, som bruges på fakturaer og tilbud.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="countryCode">{tm({ en: "Country", da: "Land" })}</Label>
                <Select
                  value={countryCode}
                  onValueChange={(nextCountry) => {
                    setCountryCode(nextCountry)
                    const preset = COUNTRY_OPTIONS.find((item) => item.code === nextCountry)
                    if (preset) {
                      setLocale(preset.defaultLocale)
                      setDefaultCurrency(preset.defaultCurrency)
                    }
                  }}
                >
                  <SelectTrigger id="countryCode">
                    <SelectValue placeholder={tm({ en: "Select country", da: "Vælg land" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {countryDisplayNames.of(country.code) ?? country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locale">{tm({ en: "Locale", da: "Sprog" })}</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger id="locale">
                    <SelectValue placeholder={tm({ en: "Select locale", da: "Vælg sprog" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALE_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {`${item} — ${languageDisplayNames.of(item.split("-")[0] ?? item) ?? item}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="timezone">{tm({ en: "Time Zone", da: "Tidszone" })}</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  maxLength={64}
                  placeholder="UTC"
                  defaultValue={timezone}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxRegime">{tm({ en: "Tax Regime", da: "Skatteregime" })}</Label>
                <Select value={taxRegime} onValueChange={(value) => setTaxRegime(value as "us_sales_tax" | "eu_vat" | "custom")}>
                  <SelectTrigger id="taxRegime">
                    <SelectValue placeholder={tm({ en: "Select tax regime", da: "Vælg skatteregime" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_REGIMES.map((regime) => (
                      <SelectItem key={regime.value} value={regime.value}>
                        {regime.value === "us_sales_tax"
                          ? tm({ en: "US Sales Tax", da: "Amerikansk salgsmoms" })
                          : regime.value === "eu_vat"
                            ? tm({ en: "EU VAT", da: "EU-moms" })
                            : tm({ en: "Custom", da: "Brugerdefineret" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pricesIncludeTax}
                onChange={(event) => setPricesIncludeTax(event.target.checked)}
              />
              {tm({ en: "Prices include tax by default", da: "Priser inkluderer moms som standard" })}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primaryTaxId">{tm({ en: "Primary Seller Tax ID", da: "Primært sælger moms-/skattenummer" })}</Label>
                <Input
                  id="primaryTaxId"
                  name="primaryTaxId"
                  maxLength={40}
                  placeholder={tm({ en: "e.g. DK12345678 / US EIN", da: "f.eks. DK12345678" })}
                  value={primaryTaxId}
                  onChange={(event) => setPrimaryTaxId(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="primaryTaxIdScheme">{tm({ en: "Tax ID Scheme", da: "Type af skattenummer" })}</Label>
                <Select value={primaryTaxIdScheme} onValueChange={setPrimaryTaxIdScheme}>
                  <SelectTrigger id="primaryTaxIdScheme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vat">VAT</SelectItem>
                    <SelectItem value="cvr">CVR</SelectItem>
                    <SelectItem value="ein">EIN</SelectItem>
                    <SelectItem value="other">{tm({ en: "Other", da: "Andet" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>{tm({ en: "Billing Defaults", da: "Standarder for fakturering" })}</CardTitle>
            <CardDescription>
              {tm({
                en: "Default currency and tax rate for new invoices and quotes.",
                da: "Standardvaluta og momssats for nye fakturaer og tilbud.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="defaultCurrency">{tm({ en: "Currency", da: "Valuta" })}</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger id="defaultCurrency">
                    <SelectValue placeholder={tm({ en: "Select currency", da: "Vælg valuta" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {`${c.value} - ${currencyDisplayNames.of(c.value) ?? c.label}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxRate">{tm({ en: "Default Tax Rate (%)", da: "Standard momssats (%)" })}</Label>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  defaultValue={settings.taxRate ?? ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice & Quote Numbering */}
        <Card>
          <CardHeader>
            <CardTitle>{tm({ en: "Invoice & Quote Numbering", da: "Nummerering af faktura og tilbud" })}</CardTitle>
            <CardDescription>
              {tm({
                en: "Prefixes and sequence numbers for generated documents.",
                da: "Præfikser og løbenumre for genererede dokumenter.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoicePrefix">{tm({ en: "Invoice Prefix", da: "Fakturapræfiks" })}</Label>
                <Input
                  id="invoicePrefix"
                  name="invoicePrefix"
                  maxLength={10}
                  pattern="^[A-Z0-9-]{1,10}$"
                  title={tm({
                    en: "Use 1-10 uppercase letters, numbers, or hyphens",
                    da: "Brug 1-10 store bogstaver, tal eller bindestreger",
                  })}
                  placeholder="INV"
                  defaultValue={settings.invoicePrefix}
                />
              </div>
              <div className="grid gap-2">
                <Label>{tm({ en: "Next Invoice Number", da: "Næste fakturanummer" })}</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  {settings.invoicePrefix}-{String(settings.invoiceNextNum).padStart(4, "0")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quotePrefix">{tm({ en: "Quote Prefix", da: "Tilbudspræfiks" })}</Label>
                <Input
                  id="quotePrefix"
                  name="quotePrefix"
                  maxLength={10}
                  pattern="^[A-Z0-9-]{1,10}$"
                  title={tm({
                    en: "Use 1-10 uppercase letters, numbers, or hyphens",
                    da: "Brug 1-10 store bogstaver, tal eller bindestreger",
                  })}
                  placeholder="QTE"
                  defaultValue={settings.quotePrefix}
                />
              </div>
              <div className="grid gap-2">
                <Label>{tm({ en: "Next Quote Number", da: "Næste tilbudsnummer" })}</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  {settings.quotePrefix}-{String(settings.quoteNextNum).padStart(4, "0")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI BYOK */}
        <Card>
          <CardHeader>
            <CardTitle>{tm({ en: "AI Invoice Drafting (BYOK)", da: "AI fakturakladde (BYOK)" })}</CardTitle>
            <CardDescription>
              {tm({
                en: "Use OpenRouter with your own API key and chosen model.",
                da: "Brug OpenRouter med din egen API-nøgle og valgte model.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="aiOpenRouterModel">{tm({ en: "OpenRouter Model", da: "OpenRouter-model" })}</Label>
              <Select value={aiOpenRouterModel} onValueChange={setAiOpenRouterModel}>
                <SelectTrigger id="aiOpenRouterModel">
                  <SelectValue placeholder="openai/gpt-4o-mini" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([aiOpenRouterModel, ...openRouterModels])).map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadOpenRouterModels}
                  disabled={loadingOpenRouterModels}
                >
                  {loadingOpenRouterModels
                    ? tm({ en: "Refreshing...", da: "Opdaterer..." })
                    : tm({ en: "Refresh models", da: "Opdater modeller" })}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {tm({
                  en: "Example: openai/gpt-4o-mini or anthropic/claude-3.5-sonnet.",
                  da: "Eksempel: openai/gpt-4o-mini eller anthropic/claude-3.5-sonnet.",
                })}
              </p>
              {openRouterModelsError && (
                <p className="text-xs text-destructive">{openRouterModelsError}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="aiOpenRouterApiKey">{tm({ en: "OpenRouter API Key", da: "OpenRouter API-nøgle" })}</Label>
              <Input
                id="aiOpenRouterApiKey"
                name="aiOpenRouterApiKey"
                type="password"
                autoComplete="off"
                placeholder="sk-or-v1-..."
                onChange={() => setClearAiOpenRouterApiKey(false)}
              />
              <p className="text-xs text-muted-foreground">
                {settings.aiByokConfigured
                  ? tm({
                      en: "A key is currently configured. Enter a new key only if you want to rotate it.",
                      da: "En nøgle er allerede konfigureret. Indtast kun en ny nøgle, hvis du vil udskifte den.",
                    })
                  : tm({
                      en: "No key configured yet.",
                      da: "Ingen nøgle er konfigureret endnu.",
                    })}
              </p>
            </div>

            {settings.aiByokConfigured && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={clearAiOpenRouterApiKey}
                  onChange={(event) => setClearAiOpenRouterApiKey(event.target.checked)}
                />
                {tm({ en: "Clear saved OpenRouter API key", da: "Fjern gemt OpenRouter API-nøgle" })}
              </label>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving
              ? tm({ en: "Saving...", da: "Gemmer..." })
              : tm({ en: "Save Settings", da: "Gem indstillinger" })}
          </Button>
        </div>
      </form>

      {/* Team Members — outside the settings form */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tm({ en: "Team Members", da: "Teammedlemmer" })}</CardTitle>
          <CardDescription>
            {tm({
              en: "Manage who has access to this organization.",
              da: "Administrer hvem der har adgang til denne organisation.",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Invite form */}
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder={tm({ en: "colleague@example.com", da: "kollega@example.com" })}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{tm({ en: "Admin", da: "Admin" })}</SelectItem>
                <SelectItem value="member">{tm({ en: "Member", da: "Medlem" })}</SelectItem>
                <SelectItem value="accountant">{tm({ en: "Accountant", da: "Bogholder" })}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={inviting} className="gap-1">
              <UserPlus className="size-4" />
              {inviting ? tm({ en: "Sending…", da: "Sender…" }) : tm({ en: "Invite", da: "Inviter" })}
            </Button>
          </form>
          {inviteError && (
            <p className="text-sm text-destructive">{inviteError}</p>
          )}

          {/* Members list */}
          {teamLoading ? (
            <p className="text-sm text-muted-foreground">{tm({ en: "Loading members…", da: "Indlæser medlemmer…" })}</p>
          ) : (
            <div className="divide-y rounded-md border">
              {members.map((m) => {
                const isSelf = m.user.id === session?.user.id
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.user.name}
                        {isSelf && (
                          <span className="ml-1 text-muted-foreground">{tm({ en: "(you)", da: "(dig)" })}</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RoleBadge role={m.role} tm={tm} />
                      {!isSelf && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive">
                              <X className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {tm({ en: "Remove member?", da: "Fjern medlem?" })}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {tm({
                                  en: `${m.user.name} will lose access to this organization immediately.`,
                                  da: `${m.user.name} mister adgang til organisationen med det samme.`,
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tm({ en: "Cancel", da: "Annuller" })}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(m.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {tm({ en: "Remove", da: "Fjern" })}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Pending invitations */}
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                      {inv.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tm({ en: "Invitation pending", da: "Invitation afventer" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RoleBadge role={inv.role} tm={tm} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleCancelInvite(inv.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
