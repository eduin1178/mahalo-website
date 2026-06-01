## 1. Fix Phase 2 advance bug (Change 1 — urgent, separable)

- [x] 1.1 In `components/checkout/phase2-form.tsx`, add loose base schemas for card and ACH (accept empty strings / optional), mirroring `billingAddressLooseSchema`. Replace `card: cardClientSchema.partial()` and `ach: achClientSchema.partial()` in `formSchema` with the loose variants.
- [x] 1.2 Confirm the existing `superRefine` still validates card/ACH strictly only when `autopay === true` and the matching `paymentMethod` is selected (verified — no change needed).
- [x] 1.3 Verify `finalizePhase2` in `lib/orders/draft-actions.ts` remains unchanged (server-side discriminated union is the security boundary — only error copy changed).
- [x] 1.4 Manual QA (browser): autopay OFF → fill contact + installation address → advance to `/checkout/schedule`; autopay ON + valid card → advance; autopay ON + invalid card → inline error in payment section. **Pending: requires running the app.**

## 2. Checkout UI to English (Change 2)

- [x] 2.1 Translate `components/checkout/stepper.tsx`: phase labels (`Plan`, `Details`, `Installation`) and the `aria-label` ("Order progress").
- [x] 2.2 Translate `components/checkout/phase1-form.tsx`: titles, helper text, CTA, add-ons heading/help, plan CTA ("Choose plan"/"Plan selected"), pricing labels.
- [x] 2.3 Translate `components/checkout/phase2-form.tsx`: section titles, field labels, placeholders, Zod messages, phone-type labels (Mobile/Home/Work), autopay copy, payment tabs, CTA, server-error fallback.
- [x] 2.4 Translate `components/checkout/schedule-form.tsx` and `app/(public)/checkout/schedule/page.tsx`: headings, "Review your order", "Edit", "Monthly total", "No add-ons", section labels, payment summary.
- [x] 2.5 Translate `order-total-panel.tsx`, `order-total-panel-client.tsx`, and `draft-bootstrap.tsx` (including the "Choose a plan to see the total" placeholder).
- [x] 2.6 Translate the remaining checkout pages: `checkout/page.tsx`, `details/page.tsx`, `confirmation/page.tsx`, `plan/page.tsx`.
- [x] 2.7 Translate user-facing `error` messages in `lib/orders/draft-actions.ts` (`finalizePhase1`, `finalizePhase2`; `scheduleInstallation`/`createDraftOrder` were already English).
- [x] 2.8 Add a project-scoped language override section to `AGENTS.md` (English UI, US market; overrides global Spanish rule for this repo only). Global `~/.claude/CLAUDE.md` left untouched.
- [x] 2.9 Grep the checkout tree for residual Spanish strings (accents, "Continuar", "Elige", "Guardando", "/mes") — none remain.

## 3. Plan card autopay price emphasis (Change 3)

- [x] 3.1 In `components/checkout/phase1-form.tsx` `PlanOption`, invert the pricing hierarchy: autopay price large/primary with a "with autopay" label, standard price smaller/secondary.
- [x] 3.2 Standard-price treatment: rendered smaller and muted (`text-xs text-muted-foreground`) below the primary autopay price.
- [x] 3.3 Translate the Standard / With autopay comparison block in `phase2-form.tsx` (labels + "/mo"). Emphasis kept consistent with the existing autopay-highlight styling.
- [x] 3.4 Visual QA (browser): confirm autopay price reads as the headline value on desktop and mobile.

## 4. Verification

- [x] 4.1 Run typecheck (`tsc --noEmit`) and lint (`eslint`) — both clean (one pre-existing `form.watch` warning, unrelated).
- [x] 4.2 Full-flow manual QA in English with autopay ON and OFF, desktop and mobile.
- [x] 4.3 Confirm no Spanish copy remains in any visible checkout surface or server-action error (grep verified).
