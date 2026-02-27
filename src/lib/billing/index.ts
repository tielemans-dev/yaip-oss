import { NoopBillingProvider } from "./noop-provider"
import type { BillingProvider } from "./types"

export const billingProvider: BillingProvider = new NoopBillingProvider()

