## 1. Unify finalize-time coverage validation

- [x] 1.1 In `lib/orders/draft-actions.ts`, import `getAvailableProviders` from `@/lib/coverage/availability` (replacing or alongside the `findProvidersByZip` import if it becomes unused).
- [x] 1.2 In `finalizePlan` (~L163), replace `const covered = await findProvidersByZip(draft.zipCode)` with a call to `getAvailableProviders(draft.zipCode)`, deriving `covered = avail.ok ? avail.providers.map((e) => e.provider) : []`, and keep the existing `covered.some((p) => p.id === plan.providerId)` rejection.
- [x] 1.3 In `finalizeProvider` (~L111), apply the identical change, matching against `parsed.data.providerId`.
- [x] 1.4 Remove the now-unused `findProvidersByZip` import from `draft-actions.ts` if no other usage remains (verify with a search before deleting).

## 2. Verify behavior

- [x] 2.1 Manual check: enter a ZIP absent from the database, confirm a fallback provider's plans appear, select a plan, and confirm checkout advances without the "This plan isn't available for your ZIP." error.
- [x] 2.2 Multi-fallback check: with two active fallback providers and no ordinary coverage for a ZIP, confirm the `/checkout/provider` screen lets you select a provider and advance to the Plan step without the "This provider isn't available for your ZIP." error.
- [x] 2.3 Precedence regression: enter a ZIP with an ordinary provider, confirm only the ordinary provider is offered and that finalizing its plan still works (fallback not offered).
- [x] 2.4 Negative check: confirm a forged request for a provider/plan NOT in the resolved set for the ZIP is still rejected as not available.
- [x] 2.5 Run typecheck/lint to confirm no unused-import or type errors after the edits.
