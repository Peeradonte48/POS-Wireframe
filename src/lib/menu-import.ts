import type {
  MenuCategory,
  MenuItem,
  MenuModifierGroup,
  MenuModifierOption,
} from '@/lib/mock-data/menu'

// ---------------------------------------------------------------------------
// Import format (wire schema) — see docs/specs/2026-04-20-menu-import-schema.md
// ---------------------------------------------------------------------------

export interface RestaurantProfile {
  id: string
  name: string
  nameTh?: string
  currency: string
  locale?: string
  logoPath?: string
}

export interface ImportCategory {
  id: string
  label: string
  labelTh: string
}

export interface ImportModifierOption {
  id: string
  label: string
  labelEn?: string
  priceAdj: number
}

export interface ImportModifierGroup {
  id: string
  label: string
  icon?: string
  type: 'single' | 'multi'
  required: boolean
  defaultOptionIds?: string[]
  options: ImportModifierOption[]
}

export interface ImportMenuItem {
  id: string
  categoryId: string
  name: string
  nameTh: string
  basePrice: number
  thumbnailPlaceholder: string
  imagePath?: string
  unsplashId?: string
  modifierGroupIds?: string[]
}

export interface MenuImportFile {
  schemaVersion: 1
  profile: RestaurantProfile
  categories: ImportCategory[]
  modifierGroups: ImportModifierGroup[]
  menuItems: ImportMenuItem[]
}

export interface ImportedMenu {
  profile: RestaurantProfile
  categories: MenuCategory[]
  modifierGroups: MenuModifierGroup[]
  menuItems: MenuItem[]
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class MenuImportError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Menu import failed:\n- ${issues.join('\n- ')}`)
    this.name = 'MenuImportError'
  }
}

function assertUniqueIds(label: string, items: { id: string }[], issues: string[]) {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) issues.push(`${label}: duplicate id "${item.id}"`)
    seen.add(item.id)
  }
}

function validate(file: MenuImportFile): string[] {
  const issues: string[] = []

  if (file.schemaVersion !== 1) {
    issues.push(`schemaVersion must be 1 (got ${String(file.schemaVersion)})`)
  }
  if (!file.profile?.id) issues.push('profile.id is required')
  if (!file.profile?.name) issues.push('profile.name is required')
  if (!file.profile?.currency) issues.push('profile.currency is required')

  assertUniqueIds('categories', file.categories, issues)
  assertUniqueIds('modifierGroups', file.modifierGroups, issues)
  assertUniqueIds('menuItems', file.menuItems, issues)

  const categoryIds = new Set(file.categories.map((c) => c.id))
  const groupById = new Map(file.modifierGroups.map((g) => [g.id, g]))

  for (const group of file.modifierGroups) {
    assertUniqueIds(`modifierGroups[${group.id}].options`, group.options, issues)
    if (group.options.length === 0) {
      issues.push(`modifierGroups[${group.id}]: must have at least 1 option`)
    }

    const optionIds = new Set(group.options.map((o) => o.id))
    for (const defaultId of group.defaultOptionIds ?? []) {
      if (!optionIds.has(defaultId)) {
        issues.push(
          `modifierGroups[${group.id}].defaultOptionIds: "${defaultId}" not found in options`,
        )
      }
    }
    if (group.type === 'single' && (group.defaultOptionIds?.length ?? 0) > 1) {
      issues.push(
        `modifierGroups[${group.id}]: type="single" allows at most 1 defaultOptionId`,
      )
    }

    for (const option of group.options) {
      if (!Number.isFinite(option.priceAdj)) {
        issues.push(
          `modifierGroups[${group.id}].options[${option.id}].priceAdj must be finite`,
        )
      }
    }
  }

  for (const item of file.menuItems) {
    if (!categoryIds.has(item.categoryId)) {
      issues.push(`menuItems[${item.id}].categoryId "${item.categoryId}" not found`)
    }
    for (const groupId of item.modifierGroupIds ?? []) {
      if (!groupById.has(groupId)) {
        issues.push(
          `menuItems[${item.id}].modifierGroupIds: "${groupId}" not found in modifierGroups`,
        )
      }
    }
    if (!Number.isFinite(item.basePrice) || item.basePrice < 0) {
      issues.push(`menuItems[${item.id}].basePrice must be a non-negative number`)
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Transform → runtime types
// ---------------------------------------------------------------------------

function toOption(o: ImportModifierOption): MenuModifierOption {
  return { id: o.id, label: o.label, labelEn: o.labelEn, priceAdj: o.priceAdj }
}

function toGroup(g: ImportModifierGroup): MenuModifierGroup {
  return {
    id: g.id,
    label: g.label,
    icon: g.icon,
    type: g.type,
    required: g.required,
    defaultOptionIds: g.defaultOptionIds,
    options: g.options.map(toOption),
  }
}

function toItem(item: ImportMenuItem, groupById: Map<string, MenuModifierGroup>): MenuItem {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    nameTh: item.nameTh,
    basePrice: item.basePrice,
    thumbnailPlaceholder: item.thumbnailPlaceholder,
    imagePath: item.imagePath,
    unsplashId: item.unsplashId,
    modifierGroups: (item.modifierGroupIds ?? [])
      .map((id) => groupById.get(id))
      .filter((g): g is MenuModifierGroup => Boolean(g)),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate and transform a menu import file into the runtime shapes used by
 * the POS (`MenuCategory`, `MenuItem`, `MenuModifierGroup`).
 *
 * Throws `MenuImportError` with every issue found when validation fails.
 */
export function importMenuProfile(file: MenuImportFile): ImportedMenu {
  const issues = validate(file)
  if (issues.length > 0) throw new MenuImportError(issues)

  const modifierGroups = file.modifierGroups.map(toGroup)
  const groupById = new Map(modifierGroups.map((g) => [g.id, g]))

  return {
    profile: file.profile,
    categories: file.categories.map((c) => ({
      id: c.id,
      label: c.label,
      labelTh: c.labelTh,
    })),
    modifierGroups,
    menuItems: file.menuItems.map((item) => toItem(item, groupById)),
  }
}

/** Parse a raw JSON string and import in one step. */
export function importMenuProfileFromJson(raw: string): ImportedMenu {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new MenuImportError([`invalid JSON: ${(err as Error).message}`])
  }
  return importMenuProfile(parsed as MenuImportFile)
}
