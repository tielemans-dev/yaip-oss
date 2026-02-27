import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../../lib/auth-client'
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

function OnboardingPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await authClient.organization.create(
      { name, slug },
      {
        onError: (ctx) => {
          setError(ctx.error.message ?? t('auth.onboarding.error'))
        },
      },
    )

    if (result.data) {
      await authClient.organization.setActive({
        organizationId: result.data.id,
      })
      setLoading(false)
      navigate({ to: '/' })
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('auth.onboarding.title')}</CardTitle>
          <CardDescription>
            {t('auth.onboarding.description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.onboarding.submitting') : t('auth.onboarding.submit')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
