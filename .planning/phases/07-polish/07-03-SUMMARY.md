---
phase: 07-polish
plan: 03
subsystem: ui
tags: [role-permissions, sonner, toasts, unsplash, next-image, zustand]

requires:
  - phase: 07-polish-02
    provides: Solar icons migrated, brand tokens, dark mode via next-themes

provides:
  - ACTION_PERMISSIONS map + canDoAction() helper in role-permissions.ts
  - Role-gated disabled states on 10 in-screen action buttons across 6 components
  - 8 new Sonner toasts across 5 components (total 10 toasts active)
  - Unsplash food photo thumbnails in MenuPanel for 7 menu items
affects:
  - Any new component adding action buttons (follow canDoAction pattern)

tech-stack:
  added: []
  patterns:
    - "Action gating: canDoAction(role, actionKey) on disabled prop — never hide, always disable"
    - "Toast placement: toast in the handler that commits the action, not in the component that triggers the UI"
    - "Void authorization: voidAuthorizedRef + setTimeout(0) to distinguish authorized close from dismissed close"
    - "Unsplash thumbnails: unsplashId on MenuItem drives next/image vs emoji fallback in MenuPanel"

key-files:
  created: []
  modified:
    - src/lib/role-permissions.ts
    - src/components/table-map/TableBottomSheet.tsx
    - src/components/table-map/OpenTableModal.tsx
    - src/components/order/TicketPanel.tsx
    - src/components/order/TicketLineItem.tsx
    - src/components/manager/EightySixTab.tsx
    - src/components/manager/EodSummaryTab.tsx
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/components/kds/KdsTicketCard.tsx
    - src/lib/mock-data/menu.ts
    - src/components/order/MenuPanel.tsx

key-decisions:
  - "Open Table toast fires in OpenTableModal.handleConfirm (not TableBottomSheet) — that is where openTable() is actually called"
  - "void-pre-send gating passed as canRemove prop to TicketLineItem — TicketPanel owns role, TicketLineItem stays role-agnostic"
  - "BUMP role gating applied to KdsTicketCard.bumpBlocked — KdsBoard delegates rendering to KdsTicketCard, role check belongs there"
  - "Void cancel toast uses setTimeout(0) deferred check — ManagerPinModal calls onOpenChange(false) before onAuthorize(), so ref check must wait one tick"
  - "Unsplash domain already in next.config.ts remotePatterns — no config change needed"

requirements-completed:
  - POLISH-01
  - POLISH-03

duration: 6min
completed: 2026-03-11
---

# Phase 07 Plan 03: Role Gating, Toasts, and Food Photos Summary

**ACTION_PERMISSIONS map with canDoAction() gating 10 in-screen actions across 6 components, 8 new Sonner toasts, and Unsplash photo thumbnails in MenuPanel**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-11T09:05:01Z
- **Completed:** 2026-03-11T09:11:15Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- `ACTION_PERMISSIONS` and `canDoAction()` added to `role-permissions.ts`; Kitchen role sees all table-map action buttons disabled; Cashier cannot send to kitchen; Waiter cannot confirm payment
- 8 new Sonner toasts wired across table open, reserve, serve, 86 toggle, shift close, void authorized, void cancelled, and payment confirmed
- Unsplash food photos render in `MenuPanel` for 7 menu items via `next/image`; emoji fallback preserved for items without `unsplashId`

## Task Commits

1. **Task 1: ACTION_PERMISSIONS + role gating on 10 actions** - `66f256d` (feat)
2. **Task 2: 8 new Sonner toasts + Unsplash food photos** - `3f52bf0` (feat)

## Files Created/Modified

- `src/lib/role-permissions.ts` - Added ActionKey type, ACTION_PERMISSIONS record, canDoAction() helper
- `src/components/table-map/TableBottomSheet.tsx` - role from useSessionStore, canDoAction on Open/Reserve/Serve/RequestCheck, toast on Reserve/Serve
- `src/components/table-map/OpenTableModal.tsx` - toast on successful open table with label + guest count
- `src/components/order/TicketPanel.tsx` - role + canDoAction on Send to Kitchen; canRemove prop to TicketLineItem; void toasts with ref-based authorized flag
- `src/components/order/TicketLineItem.tsx` - canRemove prop gates pre-send trash and post-send void buttons
- `src/components/manager/EightySixTab.tsx` - canDoAction on 86 toggle checkbox; toast.success/toast on toggle
- `src/components/manager/EodSummaryTab.tsx` - canDoAction on Close Shift button; toast.success on confirm
- `src/app/(app)/payment/[tableId]/page.tsx` - canDoAction in confirmDisabled logic; toast.success on payment confirmed
- `src/components/kds/KdsTicketCard.tsx` - role + canDoAction('kds-bump') ORed into bumpBlocked
- `src/lib/mock-data/menu.ts` - unsplashId?: string on MenuItem interface; 7 items with Unsplash IDs
- `src/components/order/MenuPanel.tsx` - next/image for items with unsplashId; emoji div fallback

## Decisions Made

- Open Table toast placed in `OpenTableModal` not `TableBottomSheet` — `TableBottomSheet` only fires `onOpenTableModal()` callback; the actual `openTable()` store call happens in `OpenTableModal.handleConfirm`, making it the correct location for the side effect toast.
- `void-pre-send` disabled state passed as `canRemove` prop to `TicketLineItem` — `TicketLineItem` is a display-only component with no store access; keeping it role-agnostic and letting `TicketPanel` inject the permission is cleaner than adding store hooks downstream.
- BUMP gating in `KdsTicketCard` (not `KdsBoard`) — `KdsBoard` only renders the column layout; the BUMP button lives in `KdsTicketCard`, which is where `bumpBlocked` is computed.
- Used `voidAuthorizedRef` + `setTimeout(0)` for void cancel detection — `ManagerPinModal` calls `onOpenChange(false)` synchronously before `onAuthorize()`, so a direct ref check at `onOpenChange` time would always see `false`. Deferring the check one tick allows `onAuthorize` to set the flag first.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Open Table toast moved to OpenTableModal**
- **Found during:** Task 2 (toast wiring)
- **Issue:** Plan instructed adding the toast in `TableBottomSheet`, but `TableBottomSheet` delegates Open Table to `onOpenTableModal()` callback — `openTable()` is never called there. Toast would never have fired.
- **Fix:** Added toast in `OpenTableModal.handleConfirm` immediately after `openTable()` call.
- **Files modified:** `src/components/table-map/OpenTableModal.tsx`
- **Verification:** tsc passes; toast fires in the correct handler
- **Committed in:** `3f52bf0` (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added canRemove prop to TicketLineItem**
- **Found during:** Task 1 (void-pre-send gating)
- **Issue:** `TicketLineItem` had no role access; plan said to add `disabled` to its trash/void buttons. Adding `useSessionStore` there would make it role-coupled. A prop was needed.
- **Fix:** Added `canRemove?: boolean` prop (default `true`) to `TicketLineItemProps`; `TicketPanel` passes `canDoAction(role, 'void-pre-send')`.
- **Files modified:** `src/components/order/TicketLineItem.tsx`, `src/components/order/TicketPanel.tsx`
- **Verification:** tsc passes; correct prop threading
- **Committed in:** `66f256d` (Task 1 commit)

**3. [Rule 1 - Bug] BUMP gating applied to KdsTicketCard not KdsBoard**
- **Found during:** Task 1 (kds-bump gating)
- **Issue:** Plan said to update `KdsBoard.tsx` but the BUMP button is rendered in `KdsTicketCard.tsx`. `KdsBoard` only renders ticket columns.
- **Fix:** Added role import and `canDoAction` OR condition to `bumpBlocked` in `KdsTicketCard`.
- **Files modified:** `src/components/kds/KdsTicketCard.tsx`
- **Verification:** tsc passes; BUMP correctly gated at the card level
- **Committed in:** `66f256d` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 - Bug, 1 Rule 2 - Missing Critical)
**Impact on plan:** All three corrections required for the feature to actually work. No scope creep.

## Issues Encountered

- `ManagerPinModal` calls `onOpenChange(false)` before `onAuthorize()` in the success path. This makes naive ref-based cancel detection fire incorrectly on authorized void. Resolved with `setTimeout(0)` deferral — `onAuthorize` sets the ref within the same synchronous block, so by the next tick the check is accurate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- POLISH-01 (role gating) and POLISH-03 (toasts + Unsplash) requirements are complete
- Plan 07-04 can proceed: covers remaining POLISH-02 (touch targets) and POLISH-04 (empty states / error states)
- No blockers

---
*Phase: 07-polish*
*Completed: 2026-03-11*
