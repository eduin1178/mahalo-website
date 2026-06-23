## 1. Provider resolution (DB-only)

- [x] 1.1 In `lib/coverage/availability.ts`, remove the `validateAddress` call and the `import` from `@/lib/usps/client`. Take the ZIP directly from the function argument.
- [x] 1.2 Add a defensive 5-digit format guard (`/^\d{5}$/`): on a malformed ZIP, return an empty provider set (`{ ok: true, zip, providers: [] }`) so callers render the existing empty state; do not throw.
- [x] 1.3 Keep the `ordinary → fallback` resolution (`findProvidersByZip` → `listFallbackProviders`) unchanged so an uncovered/unknown ZIP surfaces fallback providers.
- [x] 1.4 Reconcile the result/error types: keep the existing `AvailabilityResult` shape, but drop the now-unreachable dependency on `ValidateAddressErrorCode` if it leaves no other consumer (otherwise leave a local error code type). Ensure `provider/page.tsx` and `plan/page.tsx` still compile against the returned shape.

## 2. Draft creation (DB-only)

- [x] 2.1 In `lib/orders/draft-actions.ts` `createDraftOrder`, remove the `validateAddress` call; keep the Zod `/^\d{5}$/` schema as the only ZIP gate.
- [x] 2.2 Build the draft from the validated ZIP with `installationAddress: null` (behavior-preserving) and persist as today.
- [x] 2.3 Remove the `validateAddress` import from `draft-actions.ts` only if it is no longer referenced elsewhere in the file; do NOT delete `lib/usps/client.ts` or `lib/usps/classify.ts`.

## 3. Spec sync

- [x] 3.1 Apply the delta in `specs/checkout-wizard/spec.md` (ADDED: "ZIP availability SHALL be resolved from the database, not an external address service") to `openspec/specs/checkout-wizard/spec.md` at archive time.

## 4. Verification

- [x] 4.1 `npx tsc --noEmit` passes with no errors.
- [ ] 4.2 Manual: a covered ZIP shows its ordinary providers; an uncovered/fake well-formed ZIP (e.g. `00000`) now shows the fallback provider's plans instead of an error.
- [ ] 4.3 Manual: a non-5-digit input is rejected with the format message and creates no draft.
- [x] 4.4 Confirm no live call site imports `validateAddress` for the ZIP-search path, and the USPS client files remain present (retained for future Details verification).
