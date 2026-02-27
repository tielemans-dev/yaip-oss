import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getSession } from '../lib/auth-session'
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar'
import { AppSidebar } from '../components/app-sidebar'
import { useI18n } from '../lib/i18n/react'
import { trpc } from '../trpc/client'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    const hasActiveOrg = !!session.session.activeOrganizationId
    const isOnboarding = location.pathname === '/onboarding'
    if (!hasActiveOrg && !isOnboarding) {
      throw redirect({ to: '/onboarding' })
    }
    return { session }
  },
  component: AppLayout,
})

function AppLayout() {
  const { setLocale } = useI18n()

  useEffect(() => {
    let cancelled = false
    trpc.settings.get.query()
      .then((settings) => {
        if (!cancelled && settings.locale) {
          setLocale(settings.locale)
        }
      })
      .catch(() => {
        // Keep browser locale when settings are not yet available.
      })

    return () => {
      cancelled = true
    }
  }, [setLocale])

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger />
        </div>
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
