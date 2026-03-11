---
phase: 5
slug: payment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — TypeScript strict mode + Next.js build |
| **Config file** | tsconfig.json (strict: true) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds (tsc) / ~45 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must be green + all PAY criteria verified in browser
- **Max feedback latency:** ~15 seconds (tsc)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | PAY-01 | type-check + manual | `npx tsc --noEmit` | ❌ W1 | ⬜ pending |
| 5-01-02 | 01 | 1 | PAY-01 | type-check + manual | `npx tsc --noEmit` | ❌ W1 | ⬜ pending |
| 5-01-03 | 01 | 1 | PAY-05 | type-check + manual | `npx tsc --noEmit` | ❌ W1 | ⬜ pending |
| 5-02-01 | 02 | 1 | PAY-02 | type-check + manual | `npx tsc --noEmit` | ❌ W1 | ⬜ pending |
| 5-02-02 | 02 | 1 | PAY-02 | type-check + manual | `npx tsc --noEmit` | ❌ W1 | ⬜ pending |
| 5-03-01 | 03 | 2 | PAY-03 | type-check + manual | `npx tsc --noEmit` | ❌ W2 | ⬜ pending |
| 5-03-02 | 03 | 2 | PAY-04 | type-check + manual | `npx tsc --noEmit` | ❌ W2 | ⬜ pending |
| 5-04-01 | 04 | 3 | PAY-01–05 | build + manual | `npm run build` | ❌ W3 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files or framework installs are needed:
- TypeScript strict mode already configured in `tsconfig.json`
- `npm run build` already available
- No Jest/Vitest/Playwright — project uses manual browser verification per Phases 1–4 pattern

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bill shows itemized line items with modifier details | PAY-01 | UI rendering — no automated test framework | Open payment page for a table with items; verify each line shows name + modifier text + qty + price |
| Voided items are hidden from bill | PAY-01 | UI state verification | Create order with a voided item; confirm it does not appear on payment bill |
| Coupon discount applies correctly (VAT on post-discount subtotal) | PAY-01 | Math verification requires visual inspection | Enter coupon code + amount; verify coupon line appears; verify VAT = (subtotal - discount) × 7%; verify total = discounted + VAT |
| Cash payment shows change due | PAY-02 | UI interaction | Select Cash; enter amount > total; verify change due = entered - total |
| QR PromptPay shows static mock QR | PAY-02 | Visual | Select QR PromptPay; verify 200×200 QR image appears with total amount |
| Card shows instructional text | PAY-02 | Visual | Select Card; verify "Customer taps or swipes at card reader" copy visible |
| Confirm Payment → table becomes Cleaning | PAY-03 | Cross-screen state | Confirm payment; navigate to /table-map; verify table chip shows Cleaning status |
| Receipt screen appears with correct data | PAY-03 | UI state transition | Confirm payment; verify receipt screen shows ✔ header, table number, total, method, timestamp |
| Reprint fires Sonner toast | PAY-04 | UI interaction | On receipt screen, tap [Reprint Receipt]; verify toast "Receipt sent to printer" appears |
| Split bill placeholder visible and disabled | PAY-05 | Visual + interaction | On payment screen, verify [Split Bill → v2] button is disabled; verify annotation "ⓘ Seat-level split planned" visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
