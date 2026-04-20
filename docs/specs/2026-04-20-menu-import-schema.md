# Menu Import Schema (Restaurant Profile Variants)

**Status:** Draft · 2026-04-20
**Scope:** Define the JSON contract dev will fill from ERP to onboard a restaurant profile into the POS.

## Goal

Allow the POS to host multiple restaurant profiles. Each profile ships one JSON file containing categories, reusable modifier groups, and menu items. The importer transforms this into the runtime shapes already used by `src/lib/mock-data/menu.ts`.

## Design choices

- **Profile-scoped.** One file = one restaurant. No cross-profile references.
- **Normalized modifier groups.** Items reference `modifierGroupIds` instead of inlining groups, so a shared set (e.g. the 7 ramen-customisation groups) lives in one place and can be reused.
- **Mirror existing field names.** `priceAdj`, `nameTh`, `labelEn`, `thumbnailPlaceholder` match `menu.ts` so the importer is a near-identity transform.
- **Versioned.** `schemaVersion` lets us migrate later without breaking imports.
- **String IDs only.** All IDs are strings chosen by the source system (ERP). Importer validates uniqueness and reference integrity.

## Top-level shape

```json
{
  "schemaVersion": 1,
  "profile": { ... },
  "categories": [ ... ],
  "modifierGroups": [ ... ],
  "menuItems": [ ... ]
}
```

## `profile`

Identity and display metadata for the restaurant.

| Field        | Type                  | Required | Notes                                     |
|--------------|-----------------------|----------|-------------------------------------------|
| `id`         | `string`              | yes      | Stable slug, e.g. `"a-ramen"`.            |
| `name`       | `string`              | yes      | Display name (English or brand).          |
| `nameTh`     | `string`              | no       | Thai display name.                        |
| `currency`   | `"THB" \| "JPY" \| …` | yes      | ISO 4217.                                 |
| `locale`     | `string`              | no       | BCP 47, e.g. `"th-TH"`. Default `th-TH`.  |
| `logoPath`   | `string` (URL)        | no       | Optional brand asset.                     |

## `categories[]`

```json
{ "id": "ramen-hot", "label": "ราเมนร้อน", "labelTh": "ราเมนร้อน" }
```

| Field     | Type     | Required | Notes                              |
|-----------|----------|----------|------------------------------------|
| `id`      | `string` | yes      | Unique within the file.            |
| `label`   | `string` | yes      | Primary label (current code: Thai).|
| `labelTh` | `string` | yes      | Thai label (may duplicate `label`).|

## `modifierGroups[]`

Reusable. Items reference by `id`.

```json
{
  "id": "noodle-firmness",
  "label": "ระดับความนุ่มของเส้น",
  "icon": "🍜",
  "type": "single",
  "required": true,
  "defaultOptionIds": ["normal"],
  "options": [
    { "id": "normal", "label": "ปกติ", "labelEn": "MEDIUM", "priceAdj": 0 }
  ]
}
```

| Field              | Type                   | Required | Notes                                                  |
|--------------------|------------------------|----------|--------------------------------------------------------|
| `id`               | `string`               | yes      | Unique within `modifierGroups`.                        |
| `label`            | `string`               | yes      | Thai primary label.                                    |
| `icon`             | `string` (emoji)       | no       | Shown before label in sheets.                          |
| `type`             | `"single" \| "multi"`  | yes      | Single-choice radio or multi-select.                   |
| `required`         | `boolean`              | yes      | If true, user must choose.                             |
| `defaultOptionIds` | `string[]`             | no       | Option IDs pre-selected on new orders. Must exist.     |
| `options[]`        | `ModifierOption[]`     | yes      | ≥1 option. IDs unique within the group.                |

### `ModifierOption`

| Field      | Type     | Required | Notes                                            |
|------------|----------|----------|--------------------------------------------------|
| `id`       | `string` | yes      | Unique within the parent group.                  |
| `label`    | `string` | yes      | Thai label.                                      |
| `labelEn`  | `string` | no       | English label for bilingual sheet variants.      |
| `priceAdj` | `number` | yes      | Price delta (THB). Use `0` when no change.       |

## `menuItems[]`

```json
{
  "id": "ramen-custom",
  "categoryId": "ramen-hot",
  "name": "Custom Ramen",
  "nameTh": "ราเมงข้อสอบ",
  "basePrice": 160,
  "thumbnailPlaceholder": "🍜",
  "imagePath": "https://cdn.a-ramen.com/.../menu_img.png",
  "modifierGroupIds": ["noodle-firmness", "broth-richness"]
}
```

| Field                  | Type       | Required | Notes                                                           |
|------------------------|------------|----------|-----------------------------------------------------------------|
| `id`                   | `string`   | yes      | Unique across `menuItems`.                                      |
| `categoryId`           | `string`   | yes      | Must match a `categories[].id`.                                 |
| `name`                 | `string`   | yes      | English/brand name.                                             |
| `nameTh`               | `string`   | yes      | Thai name.                                                      |
| `basePrice`            | `number`   | yes      | In minor unit of `profile.currency`? → **No.** Use THB baht.    |
| `thumbnailPlaceholder` | `string`   | yes      | Emoji fallback when image fails.                                |
| `imagePath`            | `string`   | no       | Absolute URL; preferred over `unsplashId`.                      |
| `unsplashId`           | `string`   | no       | Fallback only.                                                  |
| `modifierGroupIds`     | `string[]` | no       | Order matters; defines display order. Empty/omitted = no customisation. |

## Validation rules (importer enforces)

1. `schemaVersion === 1`.
2. All top-level arrays present (can be empty except `menuItems`).
3. Every ID is unique within its array.
4. Every `menuItems[].categoryId` resolves to a category.
5. Every `menuItems[].modifierGroupIds[]` resolves to a modifier group.
6. Every `modifierGroups[].defaultOptionIds[]` resolves to an option of that group.
7. Every option `priceAdj` is a finite number.
8. If `type === "single"`, `defaultOptionIds` has at most 1 entry.

## Importer output

```ts
importMenuProfile(json): {
  profile: RestaurantProfile
  categories: MenuCategory[]
  menuItems: MenuItem[]          // with modifierGroups inlined (matches existing type)
  modifierGroups: MenuModifierGroup[]  // kept separately for reuse lookups
}
```

The importer resolves `modifierGroupIds` into inline `modifierGroups` on each `MenuItem` so the returned shape is drop-in compatible with `src/lib/mock-data/menu.ts`.

## Full example

```json
{
  "schemaVersion": 1,
  "profile": {
    "id": "a-ramen",
    "name": "A Ramen",
    "nameTh": "เอราเมง",
    "currency": "THB",
    "locale": "th-TH"
  },
  "categories": [
    { "id": "ramen-hot", "label": "ราเมนร้อน", "labelTh": "ราเมนร้อน" }
  ],
  "modifierGroups": [
    {
      "id": "noodle-firmness",
      "label": "ระดับความนุ่มของเส้น",
      "icon": "🍜",
      "type": "single",
      "required": true,
      "defaultOptionIds": ["normal"],
      "options": [
        { "id": "soft",   "label": "นุ่ม",   "labelEn": "SOFT",   "priceAdj": 0 },
        { "id": "normal", "label": "ปกติ",   "labelEn": "MEDIUM", "priceAdj": 0 },
        { "id": "firm",   "label": "แข็ง",   "labelEn": "FIRM",   "priceAdj": 0 }
      ]
    }
  ],
  "menuItems": [
    {
      "id": "ramen-custom",
      "categoryId": "ramen-hot",
      "name": "Custom Ramen",
      "nameTh": "ราเมงข้อสอบ",
      "basePrice": 160,
      "thumbnailPlaceholder": "🍜",
      "imagePath": "https://cdn.a-ramen.com/.../menu_img.png",
      "modifierGroupIds": ["noodle-firmness"]
    }
  ]
}
```
