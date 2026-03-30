# Phase 23: TypeScript + Dead Code - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring the codebase to zero lint errors and zero dead code — all four requirements (TS-01, TS-02, DC-01, DC-02) must pass.

Key insight from Phase 22 audit: **the TypeScript build is already clean** (0 errors). TS-01 and TS-02 are essentially satisfied — no `any`-casts were found, no implicit any, no build errors. Phase 23's real work is **DC-01** (14 ESLint errors + 12 warnings) and minor **DC-02** cleanup (no naming inconsistencies were found, so DC-02 is a pass-through).

This phase produces no new features — only lint suppressions (where patterns are intentional), genuine dead code removal, and zero tolerance for leftover unused symbols.

</domain>

<decisions>
## Implementation Decisions

### D-01: `react-hooks/set-state-in-effect` errors (11 instances)
- **Decision:** Suppress with `// eslint-disable-next-line react-hooks/set-state-in-effect` above each offending line.
- **Rationale:** The "reset state on dialog open" pattern (`useEffect(() => { if (open) setState(x) }, [open])`) is intentional in this codebase and correct React — it resets ephemeral UI state on each open. ESLint's rule is overly strict for this well-established modal pattern. This is a wireframe; the pattern is not a bug.
- **Do NOT:** Rewrite to `key`-prop resets (out of scope) or disable the rule globally (would hide future violations).
- **Affected files (from audit):** `layout.tsx`, `promotions/page.tsx`, `ModifierSheet.tsx`, `SimpleItemDialog.tsx`, `CashDialog.tsx`, `EditCustomerModal.tsx`, `NewDeliveryModal.tsx`, `OpenTableModal.tsx`, `TableBottomSheet.tsx` (two separate suppression points)

### D-02: Dead KDS navigation (`/loyalty` route doesn't exist)
- **Decision:** Remove the dead nav items completely from `src/app/(kds)/kds/page.tsx`.
- **Rationale:** `/loyalty` route does not exist; leaving broken navigation in a wireframe is misleading. Hard delete is cleaner than commenting out.
- **Affected:** `Package`, `Users`, `LineChart` icon imports and their corresponding nav item definitions in the KDS sidebar (lines 22–24 per audit).

### D-03: `Date.now()` purity warnings (3 instances)
- **Decision:** Suppress with `// eslint-disable-next-line react-hooks/purity` above each.
- **Rationale:** `useState(Date.now())` is correct — the initializer runs once, not on every render. ESLint's `purity` rule is a false positive here. No refactor needed.
- **Affected files:** `src/components/kds/useKdsTimer.ts` (line 17), `src/components/table-map/useDwellTimer.ts` (line 5), `src/components/table-map/useSentTimer.ts` (line 10)

### D-04: `<img>` element in BillLineItem
- **Decision:** Suppress with `// eslint-disable-next-line @next/next/no-img-element` above the `<img>` tag.
- **Rationale:** This is a wireframe with mock data images. Next.js `<Image />` optimization is irrelevant in a prototype context.
- **Affected file:** `src/components/payment/BillLineItem.tsx` (line 45)

### D-05: Unused imports and variables (genuine dead code — remove, don't suppress)
- **Decision:** Delete all genuinely unused symbols. Do NOT suppress with eslint-disable.
- **Items to remove:**
  - `src/components/payment/ItemSplitSheet.tsx` lines 3, 6 — delete `useMemo` and `Separator` imports
  - `src/components/payment/SplitSheet.tsx` line 38 — delete `seatCountInput` state
  - `src/components/order/TicketLineItem.tsx` line 120 — delete `canVoidSent` assignment
  - `src/app/(app)/payment/[tableId]/split-summary/page.tsx` line 70 — delete `grandTotal` assignment
  - `src/stores/kds.store.ts` line 52 — delete `RECALL_TRAY_CAP` constant
- **Note on `_` / `_removed` destructure discards in stores:** These are idiomatic Zustand patterns (`const { [id]: _, ...rest } = state`). Rename to `_void` or add `eslint-disable-next-line` — do NOT delete. Affected: `bill.store.ts` (lines 98, 248, 259), `kds.store.ts` (lines 113, 122), `order.store.ts` (line 197).

### D-06: `split-summary/page.tsx` `react-hooks/purity` warning (line 100)
- **Decision:** Suppress with `// eslint-disable-next-line react-hooks/purity`.
- **Rationale:** The audit noted this is a false positive — `Date.now()` is called in an async click handler, not at render time.

### D-07: `exhaustive-deps` issues in TableTile and TableBottomSheet
- **Decision:** Fix the unnecessary dependency (`tickets` in `TableTile.tsx` useMemo) and remove the stale `eslint-disable` directive in `TableBottomSheet.tsx`.
- **Rationale:** These are genuine correctness fixes — the `tickets` dep is unnecessary and the disable comment is stale. Small, safe changes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit
- `.planning/phases/22-codebase-audit/22-AUDIT-REPORT.md` — Phase 23 Scope section (lines 57–136). Contains the exact file + line inventory of every lint error and dead code instance.

### Project Requirements
- `.planning/REQUIREMENTS.md` — TS-01, TS-02, DC-01, DC-02 acceptance criteria
- `CLAUDE.md` — Zustand selector patterns, shadow token rules, naming conventions

### Key Source Files (by decision)
- `src/app/(kds)/kds/page.tsx` — D-02: remove dead nav items (lines 22–24)
- `src/components/kds/useKdsTimer.ts` — D-03: Date.now() suppress (line 17)
- `src/components/table-map/useDwellTimer.ts` — D-03: Date.now() suppress (line 5)
- `src/components/table-map/useSentTimer.ts` — D-03: Date.now() suppress (line 10)
- `src/components/payment/BillLineItem.tsx` — D-04: img suppress (line 45)
- `src/components/payment/ItemSplitSheet.tsx` — D-05: remove unused imports
- `src/components/payment/SplitSheet.tsx` — D-05: remove unused state
- `src/components/order/TicketLineItem.tsx` — D-05: remove unused var
- `src/app/(app)/payment/[tableId]/split-summary/page.tsx` — D-05+D-06
- `src/stores/kds.store.ts` — D-02+D-05: remove constant + discard renames
- `src/stores/bill.store.ts` — D-05: discard var renames
- `src/stores/order.store.ts` — D-05: discard var rename
- `src/app/(app)/layout.tsx` — D-01: hook suppress
- `src/app/(app)/payment/[tableId]/promotions/page.tsx` — D-01: hook suppress
- `src/components/order/ModifierSheet.tsx` — D-01: hook suppress
- `src/components/order/SimpleItemDialog.tsx` — D-01: hook suppress
- `src/components/payment/CashDialog.tsx` — D-01: hook suppress
- `src/components/queue/EditCustomerModal.tsx` — D-01: hook suppress
- `src/components/queue/NewDeliveryModal.tsx` — D-01: hook suppress
- `src/components/table-map/OpenTableModal.tsx` — D-01: hook suppress
- `src/components/table-map/TableBottomSheet.tsx` — D-01+D-07
- `src/components/table-map/TableTile.tsx` — D-07: fix unnecessary dep

</canonical_refs>

<code_context>
## Existing Code Insights

### The Work Is Precisely Scoped
The Phase 22 audit did the discovery. Phase 23 executors do NOT need to re-scan the codebase — every file, line, and fix decision is documented above and in the audit report. The planner should create tasks that reference specific file+line entries from D-01 through D-07.

### Verification Gate
After all changes: `npm run lint` must report **0 errors and 0 warnings**. `npm run build` must still pass.

### Idiomatic Zustand `_` Pattern
The `_` and `_removed` destructure discards in stores are not dead code — they are the standard "omit key from spread" pattern. Rename to `_void` (or `_removed` → `_`) to satisfy lint without changing behavior.

</code_context>

<specifics>
## Specific Notes

- Phase 23 is a **pure lint/cleanup phase** — no behavioral changes, no new components
- All changes should be individually commitable by file or logical group (e.g., "all D-01 hook suppresses" as one commit)
- Verification: `npm run lint` exits 0 after all changes; `npm run build` still passes
- The `_` → `_void` rename in stores is the idiomatic fix — don't use eslint-disable for destructure discards

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 23-typescript-dead-code*
*Context gathered: 2026-03-31*
