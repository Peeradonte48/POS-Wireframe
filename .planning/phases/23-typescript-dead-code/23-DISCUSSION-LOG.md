# Phase 23: TypeScript + Dead Code — Discussion Log

**Session:** 2026-03-31
**Status:** Complete

---

## Area 1: Hook Error Fix Strategy

**Question:** 11 dialog/modal reset effects use `useEffect(() => { setState(x) }, [dep])` — ESLint flags these as `set-state-in-effect`. How should Phase 23 handle them?

**Options presented:**
1. Suppress with `eslint-disable` *(Recommended)*
2. Rewrite to `key`-prop resets
3. Disable rule globally in ESLint config

**Selected:** Suppress with `eslint-disable-next-line react-hooks/set-state-in-effect`

---

## Area 2: Dead Code Removal Scope

**Question:** Dead nav items in KDS page pointing to `/loyalty` (route doesn't exist). How should Phase 23 handle this?

**Options presented:**
1. Remove dead nav items *(Recommended)*
2. Leave as-is, just comment out
3. Leave untouched

**Selected:** Remove dead nav items completely

---

## Area 3: `Date.now()` Purity Warnings

**Question:** 3 hooks use `useState(Date.now())` which ESLint flags as `react-hooks/purity`. Likely false positives. How to handle?

**Options presented:**
1. Suppress with `eslint-disable` *(Recommended)*
2. Refactor to `useRef` + lazy init

**Selected:** Suppress with `eslint-disable-next-line react-hooks/purity`

---

## Area 4: `<img>` Element

**Question:** `BillLineItem.tsx` uses `<img>` instead of Next.js `<Image />`. Wireframe context.

**Options presented:**
1. Suppress with `eslint-disable` *(Recommended)*
2. Swap to `<Image />`

**Selected:** Suppress with `eslint-disable-next-line @next/next/no-img-element`
