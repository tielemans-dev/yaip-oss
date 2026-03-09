# Onboarding Streamlining Design

## Goal

Reduce onboarding friction by turning the current flat cloud onboarding form into an adaptive flow that aggressively prefills defaults, asks users to confirm them, and only shows country-specific tax and compliance fields when they are actually relevant.

## Why this change

The current cloud onboarding page exposes all setup controls at once in a single form. That creates three UX problems:

- users must scan advanced defaults before they understand what is required
- country-specific tax fields appear even when they do not apply
- the flow makes localization and compliance feel manual even though the app already knows enough to prefill many values

The existing readiness rules already contain some conditional logic, such as only requiring `primaryTaxId` for `eu_vat`. The issue is mostly the UI model: the form does not reflect those rules, and it does not use country and entity signals early enough to tailor the experience.

## Recommended approach

Replace the single flat onboarding form with an adaptive, progressive disclosure flow:

- Step 1 collects the minimum business basics that determine relevance
- Step 2 shows localized defaults prefilled from those basics and asks the user to confirm or edit them
- Step 3 shows only the compliance details required for the selected country, entity type, and tax regime
- Step 4 keeps numbering and tax display defaults available, but visually secondary and collapsed by default

This keeps users in control of important defaults without making everyone read irrelevant settings.

## Alternatives considered

### 1. Keep a single form and improve labels/defaults

Pros:
- smallest implementation cost
- low risk to current data flow

Cons:
- still noisy
- still exposes irrelevant tax controls
- does not materially improve first-run clarity

### 2. Hard branch immediately on entity type

Pros:
- rapidly hides company-only fields
- easy mental model for users with clear legal structure

Cons:
- asks a heavy question too early
- can be brittle for freelancers using registered entities or mixed setups
- risks overfitting the flow to legal structure instead of invoicing needs

### 3. Adaptive progressive disclosure

Pros:
- removes noise without hiding critical defaults
- uses country and entity signals to decide relevance
- fits the existing readiness and localization model

Cons:
- requires moderate UI and state refactor
- needs clearer mapping between country, regime, and field visibility

## Design details

### Step structure

#### Step 1: Business basics

Collect only:

- organization/business name
- billing email
- country
- invoicing identity selection: individual/freelancer or registered business
- company/legal address

Rationale:

- `country` is the strongest signal for locale, currency, timezone, and likely tax regime
- invoicing identity should be a lightweight discriminator, not the main branching model
- address stays early because it is already required for readiness and users expect to provide it once

#### Step 2: Confirm localized defaults

After the user selects country and invoicing identity, prefill:

- locale
- timezone
- default currency
- suggested tax regime
- prices include tax default when relevant

The UI should clearly say these values were suggested based on country and can be edited. The goal is confirmation, not hidden automation.

#### Step 3: Relevant compliance details only

Show compliance inputs conditionally instead of always rendering them:

- only show tax ID fields when the chosen country/regime/entity combination requires or strongly suggests them
- avoid surfacing US-centric terminology for non-US users
- use country-specific labels and help text where possible, such as CVR/VAT framing for Denmark

Examples:

- Denmark + registered business should suggest `eu_vat` and show VAT/CVR guidance
- Denmark + freelancer without company should not see irrelevant US tax wording
- US users can confirm `us_sales_tax` defaults without seeing EU VAT-specific language

#### Step 4: Advanced defaults

Move lower-priority operational settings into a collapsed “Advanced defaults” section:

- invoice prefix
- quote prefix
- prices include tax, if not already surfaced as part of regime confirmation

These values should still be editable during onboarding, but they should not compete with the required identity and compliance steps.

### State model

Add an onboarding-level concept for invoicing identity, separate from the existing profile:

- `individual`
- `registered_business`

This value is for field visibility and defaulting. It should not replace the existing cloud onboarding profile unless there is a separate product reason to merge them.

The client should derive a small visibility model from:

- `countryCode`
- `taxRegime`
- `invoicingIdentity`

That visibility model should drive:

- which sections render
- which labels/help copy are used
- whether a tax ID is required, recommended, or hidden

### Readiness and validation

The readiness layer should continue to be the source of truth for completion, but it needs to support the more adaptive UX:

- keep core identity and locale defaults required
- make tax ID requirements depend on visibility rules, not just raw tax regime
- avoid marking hidden fields as missing

This likely means introducing a shared rule helper that both the UI and readiness evaluation can consume.

### AI onboarding compatibility

The AI assistant should operate on the same rule set as manual onboarding:

- if the country implies Danish defaults, the assistant should propose Danish locale/currency/timezone automatically
- follow-up questions should avoid asking for tax IDs that are not relevant
- AI-applied patches should still feed the same conditional readiness checks

### Settings page alignment

The settings page can remain more comprehensive than onboarding, but it should adopt the same relevance rules for tax fields:

- hide or de-emphasize irrelevant tax ID controls
- use the same country-aware labeling
- preserve full editability for users who need advanced configuration later

This keeps onboarding and settings consistent instead of teaching users one model during setup and another after setup.

### Error handling

- inline validation should remain lightweight during onboarding
- server-side completion should still return missing fields from canonical readiness checks
- if defaults are auto-adjusted after changing country, the UI should explain that the values were updated and remain editable

### Testing

Add coverage at three levels:

- readiness/rule-unit tests for visibility and requirement combinations
- route tests proving onboarding hides irrelevant compliance fields and prefills localized defaults
- router integration tests proving completion only requires tax IDs when the selected combination actually needs them

## Success criteria

- Danish users do not see irrelevant US-oriented tax content during onboarding
- users confirm suggested defaults instead of manually configuring every localization field
- onboarding shows fewer fields initially while preserving access to advanced defaults
- hidden fields are never returned as missing requirements
- onboarding and settings use the same relevance rules for tax-related fields
