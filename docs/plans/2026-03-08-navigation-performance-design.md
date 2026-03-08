# Navigation Performance Design

## Goal

Reduce the perceived latency of app navigation, especially between invoices and settings, by removing unnecessary client-side work from initial route entry.

## Why this change

The current app relies heavily on post-mount `useEffect` fetches for page data. In local development that mostly feels acceptable because the app server and database are nearby and long-lived. In the deployed runtime, each navigation pays real network and server overhead, so the same pattern produces visible loading delays.

The worst offenders identified in the current code are:

- the settings page fetching three independent data sources on mount, including an external OpenRouter request in some cases
- the invoices index performing `markOverdue` before listing invoices
- the invoice detail route eagerly importing the PDF generation stack into the main route chunk

## Recommended approach

Keep the route structure intact and target the largest avoidable delays first:

- defer non-critical settings requests until the user actually needs them
- remove serial pre-render work from the invoices list
- lazy-load the invoice PDF implementation only when the user clicks download

This is intentionally narrower than a full route-loader migration. A full loader/query-hydration refactor would likely help further, but it is a larger architectural change and is not required to produce meaningful improvements now.

## Alternatives considered

### 1. Full route-loader migration now

Move page data from `useEffect` into TanStack Router loaders and hydrate route data server-side.

Pros:
- strongest long-term data-loading model
- better support for preload and SSR

Cons:
- much larger diff
- touches many routes at once
- higher risk of introducing auth and SSR regressions

### 2. Infra-only tuning

Focus only on the deployed runtime, worker topology, or database tuning.

Pros:
- could reduce raw latency in production

Cons:
- does not fix the app’s current request fan-out
- local and production would still behave differently under the same route design

## Design details

### Settings page

- keep `settings.get` as the primary blocking fetch
- stop calling `ai.listModels` automatically on page mount
- load AI models only when the user explicitly requests refresh, or when the current configuration requires it to render a selected model absent from the fallback list
- stop loading the team data on initial route mount
- load the team section only when the user expands or otherwise requests it

This reduces the number of immediate requests on entry to Settings from three to one in the common case.

### Invoices list

- remove the eager `markOverdue` mutation from the initial page load path
- keep the list query as the only blocking request for entering the page

This trades slightly older overdue state on first paint for faster navigation, which is acceptable because overdue marking is background maintenance rather than user-triggered content.

### Invoice detail

- replace the eager import of `downloadInvoicePdf` with a dynamic import inside the click handler
- keep the current PDF generation behavior unchanged after the user requests a download

This should reduce the invoice-detail route chunk materially because `@react-pdf/renderer` and its dependencies no longer need to be part of the initial route bundle.

### Testing

- add route-level tests proving settings no longer auto-fetches AI models or team data on mount
- add a route-level test proving invoice detail does not import the PDF module during initial render
- keep the implementation changes small and verify with focused Vitest runs plus the relevant broader suite

## Success criteria

- entering Settings performs only the primary settings fetch in the common case
- entering Invoices no longer waits on `markOverdue` before rendering
- invoice detail initial render no longer eagerly loads the PDF stack
- focused tests cover the new lazy/deferred behavior
