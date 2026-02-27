import { router } from "./init"
import { billingRouter } from "./routers/billing"
import { catalogRouter } from "./routers/catalog"
import { contactsRouter } from "./routers/contacts"
import { dashboardRouter } from "./routers/dashboard"
import { invoicesRouter } from "./routers/invoices"
import { quotesRouter } from "./routers/quotes"
import { setupRouter } from "./routers/setup"
import { settingsRouter } from "./routers/settings"

export const appRouter = router({
  billing: billingRouter,
  catalog: catalogRouter,
  contacts: contactsRouter,
  dashboard: dashboardRouter,
  invoices: invoicesRouter,
  quotes: quotesRouter,
  setup: setupRouter,
  settings: settingsRouter,
})

export type AppRouter = typeof appRouter
