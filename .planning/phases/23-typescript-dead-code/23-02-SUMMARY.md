---
plan: 23-02
phase: 23-typescript-dead-code
status: complete
---

# 23-02 Summary: Dead Code Removal + Lint Configuration

## What was done

**Task 1 — Remove genuine dead code (7 files)**

- `kds/page.tsx` — removed unused `Users`/`LineChart` imports and `/loyalty`/`/dashboard` sidebar nav items that were never shown to Kitchen role
- `ItemSplitSheet.tsx` — removed unused `useMemo` and `Separator` imports
- `SplitSheet.tsx` — removed `seatCountInput`/`setSeatCountInput` state pair (declared but never read)
- `TicketLineItem.tsx` — removed dead `canVoidSent` prop from interface (accepted but never referenced in JSX)
- `TicketPanel.tsx` — removed `canVoidSent` prop pass-through (no longer in TicketLineItem interface)
- `split-summary/page.tsx` — removed unused `grandTotal` local variable
- `kds.store.ts` — removed unused `RECALL_TRAY_CAP` constant

**Task 2 — Rename Zustand destructure discard variables + ESLint config**

- `bill.store.ts` — renamed `_` to `_void` in 3 destructure locations (clearPromotionDiscounts, cancelSplit, clearCrmMember)
- `kds.store.ts` — renamed `_removed` to `_void` in bumpTicket and completeTicket
- `order.store.ts` — renamed `_` to `_void` in clearOrder
- `eslint.config.mjs` — added `varsIgnorePattern: '^_'` to suppress `no-unused-vars` on `_void` discard vars; added `.claude/worktrees/**` to ignore patterns to prevent sibling agent worktrees from polluting lint runs
- `SplitSheet.tsx` — removed stale eslint-disable comment left after seatCountInput removal
- `split-summary/page.tsx` — added `react-hooks/purity` suppression for Date.now() in event handler

## Verification

- `npm run build` passes with zero errors
- `npx eslint src/` (excluding e2e test files) — 0 errors, 0 warnings in production source files
