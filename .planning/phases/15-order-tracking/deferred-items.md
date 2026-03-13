# Deferred Items — Phase 15

## Pre-existing Lint Errors (out of scope)

Discovered during 15-01 full lint pass. These errors exist in unrelated files and predate Phase 15 changes. Confirmed pre-existing by checking lint before and after plan changes.

### 7 ESLint errors

1. `src/app/(app)/payment/[tableId]/page.tsx:60` — setState synchronously within an effect
2. `src/components/kds/useKdsTimer.ts:17` — Cannot call impure function during render
3. `src/components/order/ModifierSheet.tsx:95` — setState synchronously within an effect
4. `src/components/table-map/MergeSheet.tsx:33` — setState synchronously within an effect
5. `src/components/table-map/OpenTableModal.tsx:28` — setState synchronously within an effect
6. `src/components/table-map/TableBottomSheet.tsx:42` — setState synchronously within an effect
7. `src/components/table-map/useDwellTimer.ts:5` — Cannot call impure function during render

### 3 ESLint warnings (unused vars — also pre-existing)

1. `src/stores/kds.store.ts:43` — RECALL_TRAY_CAP unused
2. `src/stores/kds.store.ts:95` — _removed unused
3. `src/stores/order.store.ts:195` — _ unused
