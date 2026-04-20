# Nonna customisable items + remove default selections

**Date:** 2026-04-21
**Scope:** Data-only change to `public/profiles/nonna-twist.json` and `src/lib/mock-data/menu.ts`. No component changes.

## Problem

Six Nonna Twist menu items encode variant choices inside the item name (e.g. `"Fries (Classic / Twist / Waffle)"`). Staff cannot record which variant the customer picked — the name is informational only. A Ramen already exposes choices via a customisation sheet (`MenuItem.modifierGroups`); Nonna should follow the same pattern.

Additionally, A Ramen's seven modifier groups currently declare `defaultOptionIds`. Those defaults are dead data (no UI code reads them; `ModifierSheet` always opens with empty selections). The user has standardised on "no default — staff must explicitly tap a choice" so the data should match.

## Items in scope

| Item ID | Current name → new name | Modifier group (all `single`, `required: true`, `priceAdj: 0`) |
|---|---|---|
| `fries-classic` | "Fries (Classic / Twist / Waffle)" → "Fries" | `fries-style`: Classic / Twist / Waffle |
| `special-fries` | "Special Fries (Truffle / Blue Cheese)" → "Special Fries" | `special-fries-style`: Truffle / Blue Cheese |
| `black-mussels` | "Black Mussels in White Wine / Tomato" → "Black Mussels" | `mussels-sauce`: White Wine / Tomato |
| `nonnas-water` | "Nonna's Water (Still / Sparkling)" → "Nonna's Water" | `water-style`: Still / Sparkling |
| `juice` | "Juice (Orange / Lime / Lychee / Guava)" → "Juice" | `juice-flavor`: Orange / Lime / Lychee / Guava |
| `soft-drink` | "Coke / Coke Zero / Sprite / Fanta / Soda" → "Soft Drink" | `soft-drink-choice`: Coke / Coke Zero / Sprite / Fanta / Soda |

Thai names: strip parenthetical slashes. Where the Thai already names a single variant (e.g. `special-fries` Th = "เฟรนช์ฟรายส์ทรัฟเฟิล/บลูชีส") rename to the neutral form ("เฟรนช์ฟรายส์พิเศษ").

**Out of scope (parentheses retained — not customer-facing variants):**
- `(Regular)` on `chicken-divan`, `fish-and-chips` — clarifier, not a choice.
- Size/weight in grams on steaks (e.g. "(320g)") — fixed SKU size.
- `(Chicken)` / `(Pork)` on Schnitzel — already separate SKUs.
- `(Hot)` / `(Iced)` on coffee drinks — already separate SKUs.
- `(Single)` / `(Double)` on espresso — already separate SKUs.

## Design

### 1. `public/profiles/nonna-twist.json`

- Add six entries to `modifierGroups` array (currently empty `[]`).
- Each group: `{ id, label, icon, type: 'single', required: true, options: [{ id, label, labelEn, priceAdj: 0 }] }`. No `defaultOptionIds` field.
- Add `modifierGroupIds: ["<group-id>"]` to the six menu items.
- Rename `name` and `nameTh` to remove slash options.
- Validation (`src/lib/menu-import.ts`) already treats `defaultOptionIds` as optional — no schema change.

### 2. `src/lib/mock-data/menu.ts`

- Remove `defaultOptionIds` property from all seven entries in `RAMEN_MODIFIER_GROUPS`:
  `noodle-firmness`, `broth-richness`, `chashu`, `onion`, `spice-level`, `garlic`, `broth-oil`.

### Out of scope

- `public/profiles/matcha-cafe.json` retains its defaults — not requested.
- No changes to `ModifierSheet.tsx`, validation logic, or the menu-import schema docs. The schema already permits groups without defaults.

## Risk

- Persisted Zustand `menu-store` caches the menu snapshot — users with a loaded Nonna profile will keep the old menu until they reload the profile or clear storage. Acceptable for this wireframe.
- No existing orders reference these modifier groups (new groups, new IDs). Persisted `order-store` line items are unaffected.
- The `spice-level` group's `defaultOptionIds: ['no-spice']` is dead data at the UI level; removing it changes nothing at runtime. Same for all other Ramen groups.

## Verification

- `npm run build` passes (strict TS).
- Dev server: open a Nonna table order; confirm the six items open the customisation sheet with single-select required groups and no pre-checked option; adding without a pick shows the existing validation error scroll.
- A Ramen: open any ramen; confirm all seven groups start with nothing selected (same as current behaviour — the change is data-only).
