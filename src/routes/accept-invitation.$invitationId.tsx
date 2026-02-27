import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useI18n } from '../lib/i18n/react'

export const Route = createFileRoute('/accept-invitation/$invitationId')({
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  const { tm } = useI18n()
  const { invitationId } = Route.useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function accept() {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (cancelled) return

      if (result.error) {
        // Not logged in — redirect to login with a redirect-back param
        if (
          result.error.status === 401 ||
          result.error.code === 'UNAUTHORIZED'
        ) {
          navigate({
            to: '/login',
            search: {
              redirect: `/accept-invitation/${invitationId}`,
            },
          })
          return
        }

        setError(
          result.error.message ??
            tm({
              en: 'Failed to accept invitation.',
              da: 'Kunne ikke acceptere invitationen.',
            })
        )
        return
      }

      if (result.data) {
        await authClient.organization.setActive({
          organizationId: result.data.invitation.organizationId,
        })
        if (!cancelled) {
          navigate({ to: '/' })
        }
      }
    }

    accept()

    return () => {
      cancelled = true
    }
  }, [invitationId, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              {tm({ en: 'Invitation error', da: 'Invitationsfejl' })}
            </CardTitle>
            <CardDescription>
              {tm({
                en: 'This invitation could not be accepted.',
                da: 'Denne invitation kunne ikke accepteres.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
            <Button variant="outline" onClick={() => navigate({ to: '/' })}>
              {tm({ en: 'Go home', da: 'Gå til forsiden' })}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {tm({ en: 'Accepting invitation', da: 'Accepterer invitation' })}
          </CardTitle>
          <CardDescription>
            {tm({ en: 'Please wait a moment...', da: 'Vent venligst et øjeblik...' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {tm({ en: 'Accepting invitation...', da: 'Accepterer invitation...' })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
