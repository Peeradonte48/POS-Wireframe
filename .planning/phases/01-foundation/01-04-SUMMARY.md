---
phase: 01-foundation
plan: 04
subsystem: auth
tags: [react, nextjs, zustand, tailwind, lucide-react, shadcn-ui, base-ui]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: useSessionStore.openShift(branch, branchName, openingCash), BRANCHES fixture, session.store types
  - phase: 01-foundation plan 02
    provides: PinNumpad component with onComplete/error/onErrorClear/label props
  - phase: 01-foundation plan 03
    provides: AppShell with soft gate pattern, (app)/layout.tsx auth guard redirecting pre-shift users to /shift-open

provides:
  - ShiftOpenForm component with branch dropdown (3 A Ramen branches) and Thai Baht-prefixed opening cash input
  - shift-open page calling openShift then navigating to /table-map with no intermediate screen
  - ManagerPinModal reusable overlay that wraps PinNumpad for any manager authorization action
  - Label UI component (missing from initial install, added as auto-fix)

affects:
  - Phase 3+ screens: ManagerPinModal is the universal manager authorization pattern for void/discount/refund actions
  - All (app)/ routes: shift gate is now functionally complete — staff must open a shift before any POS screen is accessible

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Base UI Select onValueChange receives (value: string | null) — null guard required when using with string state"
    - "Base UI Dialog disablePointerDismissal prop (Root level) prevents outside click dismissal — Radix onInteractOutside does not exist"
    - "ManagerPinModal: parent controls open state; modal verifies PIN internally and calls onAuthorize() on success"

key-files:
  created:
    - src/components/shift/ShiftOpenForm.tsx
    - src/components/auth/ManagerPinModal.tsx
    - src/components/ui/label.tsx
  modified:
    - src/app/(app)/shift-open/page.tsx

key-decisions:
  - "ManagerPinModal verifies PIN internally (via verifyPin('Manager', pin)) rather than delegating to parent — keeps parent usage simple"
  - "disablePointerDismissal on Dialog Root (not onInteractOutside) — Base UI API difference from Radix UI"
  - "Label component added as inline UI primitive (not installed via CLI) — shadcn/ui Label was missing from initial install"

patterns-established:
  - "ManagerPinModal pattern: <ManagerPinModal open={...} onOpenChange={...} actionLabel='Authorize: Void Item' onAuthorize={() => ...} /> — reuse in Phase 3+"
  - "Shift gate: openShift() call followed immediately by router.replace('/table-map') — no confirmation screen"

requirements-completed:
  - AUTH-03
  - AUTH-04

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 1 Plan 04: Shift Open Screen + Manager PIN Modal Summary

**Shift gate (branch dropdown + Thai Baht cash input) and reusable manager authorization overlay using PinNumpad inside Base UI Dialog**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T05:49:40Z
- **Completed:** 2026-03-10T05:54:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- ShiftOpenForm renders branch dropdown (3 A Ramen branches from BRANCHES fixture) and ฿-prefixed opening cash input; submit button disabled until branch selected and cash field non-empty; valid submit calls `openShift(branchId, branchName, cashNum)` then `router.replace('/table-map')`
- shift-open page replaces placeholder — renders ShiftOpenForm with AlarmClock icon header inside existing AppShell; locked sidebar from Plan 03 is visible automatically
- ManagerPinModal is a full overlay Dialog (Base UI, dark backdrop, centered card) wrapping PinNumpad; actionLabel shown above numpad; correct Manager PIN calls onAuthorize() and closes modal; wrong PIN triggers PinNumpad shake/error
- Label UI component added as missing primitive needed by ShiftOpenForm

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ShiftOpenForm and shift-open page** - `37cb744` (feat)
2. **Task 2: Build ManagerPinModal** - `dce8abf` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/components/shift/ShiftOpenForm.tsx` - Branch dropdown + Thai Baht opening cash input + submit; calls parent onSubmit with (branchId, branchName, openingCash)
- `src/app/(app)/shift-open/page.tsx` - Shift open page; calls openShift + router.replace('/table-map') on submit
- `src/components/auth/ManagerPinModal.tsx` - Manager PIN override modal; Dialog wrapping PinNumpad; verifies Manager role PIN; exports ManagerPinModal and ManagerPinModalProps
- `src/components/ui/label.tsx` - Simple label primitive (was missing from initial shadcn/ui install)

## Decisions Made

- ManagerPinModal performs PIN verification internally using `verifyPin('Manager', pin)` rather than passing the PIN to the parent. This keeps the usage API minimal: parent only needs `onAuthorize()`.
- `disablePointerDismissal` placed on the Dialog Root (not onInteractOutside on DialogContent) — Base UI's API differs from Radix UI. Prevents accidental dismissal during PIN entry on a POS terminal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing Label UI component**
- **Found during:** Task 1 (Build ShiftOpenForm and shift-open page)
- **Issue:** `@/components/ui/label` import failed — Label was not included in the initial shadcn/ui install in Plan 01
- **Fix:** Created `src/components/ui/label.tsx` as a simple label primitive matching shadcn/ui conventions
- **Files modified:** `src/components/ui/label.tsx`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `37cb744` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Base UI Select onValueChange null handling**
- **Found during:** Task 1 (Build ShiftOpenForm and shift-open page)
- **Issue:** Base UI Select's `onValueChange` is typed `(value: string | null, eventDetails) => void` but `setBranchId` expects `string` — TS2322 type error
- **Fix:** Changed `onValueChange={setBranchId}` to `onValueChange={(val) => setBranchId(val ?? '')}` with null guard
- **Files modified:** `src/components/shift/ShiftOpenForm.tsx`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `37cb744` (Task 1 commit)

**3. [Rule 1 - Bug] Replaced Radix onInteractOutside with Base UI disablePointerDismissal**
- **Found during:** Task 2 (Build ManagerPinModal)
- **Issue:** Plan used `onInteractOutside={(e) => e.preventDefault()}` which is a Radix UI prop; project uses Base UI Dialog — TS2322 prop does not exist error
- **Fix:** Moved dismissal prevention to `<Dialog disablePointerDismissal>` at Root level (Base UI equivalent)
- **Files modified:** `src/components/auth/ManagerPinModal.tsx`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `dce8abf` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All fixes required for TypeScript strict mode compliance. No scope change — feature behavior matches plan specification exactly.

## Issues Encountered

The plan's code examples were written against the Radix UI / shadcn shadcn-ui Select and Dialog API. This project uses Base UI equivalents (Select.Root onValueChange signature and Dialog.Root dismissal API differ). Both were detected and fixed automatically.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Shift gate is functionally complete: authenticated staff without an open shift land on /shift-open, fill out the form, and are redirected to /table-map
- ManagerPinModal is ready for Phase 3+ usage — import `ManagerPinModal, ManagerPinModalProps` from `@/components/auth/ManagerPinModal`
- Phase 1 has one plan remaining: Plan 05 (navigation)
- AUTH-03 and AUTH-04 requirements are complete

---
*Phase: 01-foundation*
*Completed: 2026-03-10*

## Self-Check: PASSED

- FOUND: src/components/shift/ShiftOpenForm.tsx
- FOUND: src/app/(app)/shift-open/page.tsx
- FOUND: src/components/auth/ManagerPinModal.tsx
- FOUND: src/components/ui/label.tsx
- FOUND: commit 37cb744 (Task 1)
- FOUND: commit dce8abf (Task 2)
