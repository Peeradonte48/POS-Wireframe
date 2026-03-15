# Deferred Items — Phase 19

## Pre-existing Lint Errors (out of scope)

Discovered during 19-01 execution. These errors existed before any Phase 19 changes (confirmed via git stash baseline check). Zero new errors introduced by Phase 19 work.

| File | Line | Rule | Description |
|------|------|------|-------------|
| src/components/kds/useKdsTimer.ts | 17 | react-hooks/purity | Date.now() in useState initializer |
| src/components/order/ModifierSheet.tsx | 95 | react-hooks/set-state-in-effect | setState in useEffect body |
| src/components/queue/EditCustomerModal.tsx | 37 | react-hooks/set-state-in-effect | setState in useEffect body |
| src/components/table-map/MergeSheet.tsx | 33 | react-hooks/set-state-in-effect | setState in useEffect body |
| src/components/table-map/OpenTableModal.tsx | 28 | react-hooks/set-state-in-effect | setState in useEffect body |
| src/components/table-map/TableBottomSheet.tsx | 43, 50 | react-hooks/set-state-in-effect | setState in useEffect body (2 instances) |
| src/components/table-map/useDwellTimer.ts | 5 | react-hooks/purity | Date.now() in useState initializer |
| src/components/table-map/useSentTimer.ts | 10 | react-hooks/purity | Date.now() in useState initializer |

Total: 9 errors, 7 warnings (all pre-existing)
