import type { BillingProvider } from "./types"

export class NoopBillingProvider implements BillingProvider {
  async getSubscription() {
    return {
      status: "free" as const,
      priceId: null,
    }
  }

  async assertInvoiceCreationAllowed() {
    // Self-host distribution has no hosted billing limits.
  }

  async createCheckoutSession() {
    return { url: null }
  }

  async createPortalSession() {
    return { url: null }
  }
}

