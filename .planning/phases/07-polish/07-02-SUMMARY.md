---
phase: 07-polish
plan: 02
subsystem: icons
tags: [solar-icons, lucide-migration, wordmark, theme-toggle, polish]
dependency_graph:
  requires: [07-01]
  provides: [solar-icons-complete, a-ramen-wordmark, theme-toggle-icons]
  affects: [all-components]
tech_stack:
  added: []
  removed: [lucide-react]
  patterns: [solar-icon-set flat named exports (style embedded in name e.g. LogoutLinear)]
key_files:
  created: []
  modified:
    - src/components/app-shell/AppHeader.tsx
    - src/components/app-shell/AppShell.tsx
    - src/components/app-shell/AppSidebar.tsx
    - src/components/auth/PinNumpad.tsx
    - src/components/auth/RoleSelector.tsx
    - src/components/auth/ManagerPinModal.tsx
    - src/components/table-map/TableTile.tsx
    - src/components/table-map/TableBottomSheet.tsx
    - src/components/order/TicketLineItem.tsx
    - src/components/order/ModifierSheet.tsx
    - src/components/payment/ReceiptScreen.tsx
    - src/components/ui/theme-toggle.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/select.tsx
    - src/app/(app)/order/[tableId]/page.tsx
    - src/app/(app)/payment/[tableId]/page.tsx
    - src/app/(app)/shift-open/page.tsx
    - src/app/(auth)/login/page.tsx
decisions:
  - "Solar icon set uses flat named exports with style embedded in name (e.g. SidebarMinimalisticLinear not <Icon iconStyle='Linear'>) — plan doc had wrong API, corrected at implementation"
  - "ThemeToggle upgraded from unicode text placeholders to SunLinear/MoonLinear Solar icons in same task"
  - "dialog.tsx and select.tsx (UI primitives) also had lucide imports — migrated as part of zero-lucide goal"
  - "CardTransferHorizontalLinear missing in package — used CardTransferLinear as equivalent"
  - "Chef missing in package — used ChefHatLinear as exact Lucide ChefHat equivalent"
  - "AlarmClock missing as AlarmClockLinear — used AlarmLinear which matches the clock alarm visual"
  - "CreditCard in TableTile mapped to WalletLinear (payment intent more accurate than card transfer)"
metrics:
  duration: 7min
  completed_date: "2026-03-11"
  tasks_completed: 2
  files_modified: 19
---

# Phase 7 Plan 02: Icon Migration (Lucide → Solar) Summary

Complete migration of all Lucide React icon imports to Solar Icon Set across the entire codebase. Adds "A Ramen" wordmark to AppHeader and upgrades ThemeToggle to Solar Sun/Moon icons. Removes lucide-react package.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | App-shell group + wordmark + ThemeToggle | b284022 | AppHeader wordmark, AppShell sidebar icon, AppSidebar 6 icons, LucideIcon type removed |
| 2 | All remaining components + uninstall lucide-react | 1091f5d | 16 files migrated, lucide-react uninstalled, next build passes |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Solar icon API is flat named exports, not iconStyle prop**
- **Found during:** Task 1
- **Issue:** Plan documented usage `<TrashBinTrash size={15} iconStyle="Linear" />` with a `iconStyle` prop. The actual solar-icon-set v2.x API uses flat exports where style is embedded in the name: `TrashBinTrashLinear`, `TrashBinTrashBold`, etc. The `iconStyle` prop does not exist.
- **Fix:** Used correct flat-named exports throughout (e.g., `LogoutLinear` → `Logout3Linear`, `SidebarMinimalisticLinear`, `TrashBinTrashLinear`)
- **Files modified:** All 19 migrated files
- **Commits:** b284022, 1091f5d

**2. [Rule 2 - Missing] ThemeToggle had text placeholder icons**
- **Found during:** Task 2
- **Issue:** STATE.md noted "ThemeToggle uses text symbol placeholders — Plan 02 replaces with Solar Sun/Moon SVG icons" — this was an explicit pending item
- **Fix:** Updated ThemeToggle to use `SunLinear`/`MoonLinear` from solar-icon-set
- **Files modified:** src/components/ui/theme-toggle.tsx
- **Commit:** 1091f5d

**3. [Rule 1 - Bug] dialog.tsx and select.tsx had undocumented lucide imports**
- **Found during:** Task 2
- **Issue:** Plan listed 14 files; grep revealed 4 additional files with lucide-react imports (dialog.tsx, select.tsx, shift-open/page.tsx, login/page.tsx)
- **Fix:** Migrated all 4 additional files to Solar equivalents
- **Files modified:** src/components/ui/dialog.tsx, src/components/ui/select.tsx, src/app/(app)/shift-open/page.tsx, src/app/(auth)/login/page.tsx
- **Commit:** 1091f5d

### Icon Name Resolutions (plan mapping corrections)

| Lucide Original | Plan Suggested | Actual Solar Name Used | Reason |
|----------------|----------------|------------------------|--------|
| LogOut | LogOut | Logout3Linear | LogoutLinear missing; Logout3Linear is closest |
| CardTransferHorizontal | CardTransferHorizontal | CardTransferLinear | Horizontal variant missing in package |
| Chef | Chef | ChefHatLinear | Chef base name missing; ChefHatLinear is exact Lucide ChefHat equivalent |
| AlarmClock | AlarmClock | AlarmLinear | AlarmClockLinear missing; AlarmLinear has same alarm-clock visual |
| CreditCard (TableTile) | CardTransferHorizontal | WalletLinear | Payment/check context — wallet more semantically accurate |

## Verification Results

- `grep -r "lucide-react" src/` — returns empty (zero imports)
- `npx tsc --noEmit` — passes clean (no TypeScript errors)
- `npx next build` — succeeds, all 10 routes generated

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| AppHeader.tsx exists | FOUND |
| AppSidebar.tsx exists | FOUND |
| theme-toggle.tsx exists | FOUND |
| Commit b284022 exists | FOUND |
| Commit 1091f5d exists | FOUND |
| No lucide-react imports in src/ | PASS |
| lucide-react removed from package.json | NOT FOUND (correctly removed) |
