# Requirements: v1.4 Codebase Cleanup

**Milestone:** v1.4 Codebase Cleanup
**Status:** Active
**Created:** 2026-03-30

---

## v1 Requirements

### Audit

- [x] **AUD-01**: Codebase audit produces a written map of structural issues, dead code, and type errors across all source files
- [x] **AUD-02**: Known tech debt items (DLVR-04/05, TKWY-04, 5 E2E flows) are documented with root cause and fix approach

### TypeScript

- [ ] **TS-01**: All `any`-casts and implicit `any` types are resolved or explicitly justified
- [ ] **TS-02**: `npm run build` completes with zero TypeScript errors

### Dead Code & Style

- [ ] **DC-01**: Unused imports, variables, and unreachable code removed across the codebase
- [ ] **DC-02**: Naming conventions are consistent (files, components, stores, types)

### Refactor

- [ ] **REF-01**: Complex components identified in audit are simplified or decomposed
- [x] **REF-02**: Duplicated patterns across components are consolidated

### Tech Debt

- [ ] **TD-01**: DLVR-04/05 — KDS `New→InProgress` bump mirrors to queue `Confirmed→Preparing`
- [ ] **TD-02**: TKWY-04 — empty order.store + persistent queue.store edge case on browser reload resolved
- [ ] **TD-03**: The 5 multi-screen E2E flows flagged `human_needed` are documented with test instructions (or automated where feasible)

---

## Future Requirements

*(Requirements deferred to a future milestone)*

---

## Out of Scope

- New features or UI screens — this milestone is cleanup only
- Backend / API integration — wireframe only
- Design system changes beyond fixing existing inconsistencies

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUD-01 | Phase 22 | Complete |
| AUD-02 | Phase 22 | Complete |
| TS-01  | Phase 23 | Pending |
| TS-02  | Phase 23 | Pending |
| DC-01  | Phase 23 | Pending |
| DC-02  | Phase 23 | Pending |
| REF-01 | Phase 24 | Pending |
| REF-02 | Phase 24 | Complete |
| TD-01  | Phase 25 | Pending |
| TD-02  | Phase 25 | Pending |
| TD-03  | Phase 25 | Pending |
