import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient, useSession } from '../../lib/auth-client'
import { isCloudDistribution } from '../../lib/distribution'
import { trpc } from '../../trpc/client'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useI18n } from '../../lib/i18n/react'
import { COUNTRY_OPTIONS, LOCALE_OPTIONS, TAX_REGIMES } from '../../lib/compliance/countries'
import { AiAssistantPanel } from '../../components/onboarding/ai-assistant-panel'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

type CloudOnboardingMethod = 'manual' | 'ai'
type CloudTaxRegime = 'us_sales_tax' | 'eu_vat' | 'custom'
type RuntimeCapabilities = {
  onboardingAi: {
    enabled: boolean
  }
}

type CloudOnboardingValues = {
  companyName: string
  companyAddress: string
  companyEmail: string
  countryCode: string
  locale: string
  timezone: string
  defaultCurrency: string
  taxRegime: CloudTaxRegime
  pricesIncludeTax: boolean
  primaryTaxId: string
  primaryTaxIdScheme: string
  invoicePrefix: string
  quotePrefix: string
}

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'DKK', label: 'DKK' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
]

const DEFAULT_CLOUD_ONBOARDING_VALUES: CloudOnboardingValues = {
  companyName: '',
  companyAddress: '',
  companyEmail: '',
  countryCode: 'US',
  locale: 'en-US',
  timezone: 'UTC',
  defaultCurrency: 'USD',
  taxRegime: 'us_sales_tax',
  pricesIncludeTax: false,
  primaryTaxId: '',
  primaryTaxIdScheme: 'vat',
  invoicePrefix: 'INV',
  quotePrefix: 'QTE',
}

function parseCloudOnboardingValues(values?: Record<string, unknown> | null): CloudOnboardingValues {
  return {
    companyName: String(values?.companyName ?? ''),
    companyAddress: String(values?.companyAddress ?? ''),
    companyEmail: String(values?.companyEmail ?? ''),
    countryCode: String(values?.countryCode ?? 'US'),
    locale: String(values?.locale ?? 'en-US'),
    timezone: String(values?.timezone ?? 'UTC'),
    defaultCurrency: String(values?.defaultCurrency ?? 'USD'),
    taxRegime: (values?.taxRegime as CloudTaxRegime) ?? 'us_sales_tax',
    pricesIncludeTax: Boolean(values?.pricesIncludeTax),
    primaryTaxId: String(values?.primaryTaxId ?? ''),
    primaryTaxIdScheme: String(values?.primaryTaxIdScheme ?? 'vat'),
    invoicePrefix: String(values?.invoicePrefix ?? 'INV'),
    quotePrefix: String(values?.quotePrefix ?? 'QTE'),
  }
}

function OnboardingPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const router = useRouter()
  const { data: session } = useSession()
  const hasActiveOrg = Boolean(session?.session.activeOrganizationId)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<CloudOnboardingMethod>('manual')
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [runtimeCapabilities, setRuntimeCapabilities] = useState<RuntimeCapabilities | null>(null)
  const [values, setValues] = useState<CloudOnboardingValues>(
    DEFAULT_CLOUD_ONBOARDING_VALUES
  )

  useEffect(() => {
    if (!isCloudDistribution || !hasActiveOrg) {
      return
    }

    let cancelled = false
    setStatusLoading(true)

    trpc.onboarding.getStatus
      .query()
      .then((status) => {
        if (cancelled) {
          return
        }

        if (status.values) {
          setValues(parseCloudOnboardingValues(status.values))
          if (status.values.onboardingMethod === 'ai') {
            setMethod('ai')
          }
        }

        setMissingFields(Array.isArray(status.missing) ? status.missing : [])

        if (status.isComplete) {
          navigate({ to: '/' })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load onboarding status')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatusLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [hasActiveOrg, navigate])

  useEffect(() => {
    if (!isCloudDistribution || !hasActiveOrg) {
      setRuntimeCapabilities(null)
      return
    }

    let cancelled = false

    trpc.runtime.capabilities
      .query()
      .then((capabilities) => {
        if (!cancelled) {
          setRuntimeCapabilities(capabilities as RuntimeCapabilities)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRuntimeCapabilities(null)
          setMethod('manual')
        }
      })

    return () => {
      cancelled = true
    }
  }, [hasActiveOrg])

  useEffect(() => {
    if (!runtimeCapabilities?.onboardingAi.enabled && method === 'ai') {
      setMethod('manual')
    }
  }, [method, runtimeCapabilities])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  function updateValue<Key extends keyof CloudOnboardingValues>(
    key: Key,
    value: CloudOnboardingValues[Key]
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleCreateOrganization(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await authClient.organization.create(
      { name, slug },
      {
        onError: (ctx) => {
          setError(ctx.error.message ?? t('auth.onboarding.error'))
        },
      }
    )

    if (!result.data) {
      setSubmitting(false)
      return
    }

    await authClient.organization.setActive({
      organizationId: result.data.id,
    })

    setSubmitting(false)
    await router.invalidate()
    navigate({ to: '/', replace: true })
  }

  async function handleCompleteCloudOnboarding(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const draft = await trpc.onboarding.saveDraft.mutate({
        companyName: values.companyName,
        companyAddress: values.companyAddress,
        companyEmail: values.companyEmail,
        countryCode: values.countryCode,
        locale: values.locale,
        timezone: values.timezone,
        defaultCurrency: values.defaultCurrency,
        taxRegime: values.taxRegime,
        pricesIncludeTax: values.pricesIncludeTax,
        primaryTaxId: values.primaryTaxId.trim() || null,
        primaryTaxIdScheme: values.primaryTaxIdScheme,
        invoicePrefix: values.invoicePrefix,
        quotePrefix: values.quotePrefix,
      })

      setMissingFields(Array.isArray(draft.missing) ? draft.missing : [])

      await trpc.onboarding.completeManual.mutate({ method })
      navigate({ to: '/' })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to complete onboarding'
      setError(message)
      setSubmitting(false)
    }
  }

  if (!hasActiveOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.onboarding.title')}</CardTitle>
            <CardDescription>
              {t('auth.onboarding.description')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateOrganization}>
            <CardContent className="flex flex-col gap-4">
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="org-name">{t('auth.onboarding.orgName')}</Label>
                <Input
                  id="org-name"
                  type="text"
                  placeholder={t('auth.onboarding.placeholder.orgName')}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="org-slug">{t('auth.onboarding.slug')}</Label>
                <Input
                  id="org-slug"
                  type="text"
                  placeholder={t('auth.onboarding.placeholder.slug')}
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setSlugTouched(true)
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('auth.onboarding.slugHelp')}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('auth.onboarding.submitting') : t('auth.onboarding.submit')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  if (!isCloudDistribution) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.onboarding.configured.title')}</CardTitle>
            <CardDescription>
              {t('auth.onboarding.configured.description')}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button type="button" className="w-full" onClick={() => navigate({ to: '/' })}>
              {t('auth.onboarding.configured.continue')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Finish organization setup</CardTitle>
          <CardDescription>
            Complete these defaults once so you can immediately create invoices and quotes.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCompleteCloudOnboarding}>
          <CardContent className="space-y-6">
            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {statusLoading && (
              <p className="text-sm text-muted-foreground">Loading onboarding state…</p>
            )}

            <div className={`grid gap-3 ${runtimeCapabilities?.onboardingAi.enabled ? 'md:grid-cols-2' : ''}`}>
              <button
                type="button"
                onClick={() => setMethod('manual')}
                className={`rounded-lg border p-4 text-left ${method === 'manual' ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <p className="text-sm font-semibold">Manual setup</p>
                <p className="mt-1 text-xs text-muted-foreground">Fill all required fields directly.</p>
              </button>
              {runtimeCapabilities?.onboardingAi.enabled ? (
                <button
                  type="button"
                  onClick={() => setMethod('ai')}
                  className={`rounded-lg border p-4 text-left ${method === 'ai' ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <p className="text-sm font-semibold">AI setup assistant (cloud only)</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI mode uses managed cloud credits. You can switch to manual at any time.
                  </p>
                </button>
              ) : null}
            </div>

            {runtimeCapabilities?.onboardingAi.enabled && method === 'ai' ? (
              <AiAssistantPanel
                values={values}
                missing={missingFields}
                disabled={submitting || statusLoading}
                onApplied={(result) => {
                  setValues(parseCloudOnboardingValues(result.values))
                  setMissingFields(Array.isArray(result.missing) ? result.missing : [])
                }}
              />
            ) : null}

            {missingFields.length > 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                Missing required fields: {missingFields.join(', ')}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  value={values.companyName}
                  onChange={(e) => updateValue('companyName', e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="companyEmail">Billing email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={values.companyEmail}
                  onChange={(e) => updateValue('companyEmail', e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="companyAddress">Company address</Label>
                <Input
                  id="companyAddress"
                  value={values.companyAddress}
                  onChange={(e) => updateValue('companyAddress', e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="countryCode">Country</Label>
                <select
                  id="countryCode"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={values.countryCode}
                  onChange={(e) => updateValue('countryCode', e.target.value)}
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="locale">Locale</Label>
                <select
                  id="locale"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={values.locale}
                  onChange={(e) => updateValue('locale', e.target.value)}
                >
                  {LOCALE_OPTIONS.map((locale) => (
                    <option key={locale} value={locale}>
                      {locale}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={values.timezone}
                  onChange={(e) => updateValue('timezone', e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="defaultCurrency">Default currency</Label>
                <select
                  id="defaultCurrency"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={values.defaultCurrency}
                  onChange={(e) => updateValue('defaultCurrency', e.target.value)}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="taxRegime">Tax regime</Label>
                <select
                  id="taxRegime"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={values.taxRegime}
                  onChange={(e) => updateValue('taxRegime', e.target.value as CloudTaxRegime)}
                >
                  {TAX_REGIMES.map((regime) => (
                    <option key={regime.value} value={regime.value}>
                      {regime.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="primaryTaxId">Primary tax ID (when required)</Label>
                <Input
                  id="primaryTaxId"
                  value={values.primaryTaxId}
                  onChange={(e) => updateValue('primaryTaxId', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="invoicePrefix">Invoice prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={values.invoicePrefix}
                  onChange={(e) => updateValue('invoicePrefix', e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="quotePrefix">Quote prefix</Label>
                <Input
                  id="quotePrefix"
                  value={values.quotePrefix}
                  onChange={(e) => updateValue('quotePrefix', e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.pricesIncludeTax}
                onChange={(e) => updateValue('pricesIncludeTax', e.target.checked)}
              />
              Prices include tax
            </label>
          </CardContent>
          <CardFooter className="pt-3">
            <Button type="submit" className="w-full" disabled={submitting || statusLoading}>
              {submitting ? 'Finishing onboarding…' : 'Finish onboarding'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
