import { NoopBillingProvider } from "../billing/noop-provider"
import type { BillingProvider } from "../billing/types"
import { type OnboardingAiSuggestion, type OnboardingPatch } from "../onboarding/ai-contract"
import type { OnboardingMissingField } from "../onboarding/readiness"
import { suggestOnboardingPatchHeuristically } from "../onboarding/ai-fallback"

export type OnboardingAiSuggestInput = {
  userMessage: string
  currentValues: Partial<OnboardingPatch>
  missing: readonly OnboardingMissingField[]
}

export type OnboardingAiService = {
  suggestPatch: (input: OnboardingAiSuggestInput) => Promise<OnboardingAiSuggestion>
}

type RuntimeServices = {
  billingProvider: BillingProvider
  onboardingAiService: OnboardingAiService
}

const defaultServices: RuntimeServices = {
  billingProvider: new NoopBillingProvider(),
  onboardingAiService: {
    suggestPatch: async (input) => suggestOnboardingPatchHeuristically(input),
  },
}

let runtimeServices: RuntimeServices = { ...defaultServices }

export function setRuntimeServices(overrides: Partial<RuntimeServices>) {
  runtimeServices = {
    ...runtimeServices,
    ...overrides,
  }
}

export function resetRuntimeServices() {
  runtimeServices = { ...defaultServices }
}

export function getBillingProvider(): BillingProvider {
  return runtimeServices.billingProvider
}

export function getOnboardingAiService(): OnboardingAiService {
  return runtimeServices.onboardingAiService
}
