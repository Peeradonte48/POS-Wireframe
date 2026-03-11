export interface MenuModifierOption {
  id: string
  label: string
  priceAdj: number
}

export interface MenuModifierGroup {
  id: string
  label: string
  type: 'single' | 'multi'
  required: boolean
  options: MenuModifierOption[]
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  nameTh: string
  basePrice: number
  thumbnailPlaceholder: string
  unsplashId?: string
  modifierGroups: MenuModifierGroup[]
}

export interface MenuCategory {
  id: string
  label: string
  labelTh: string
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'ramen', label: 'Ramen', labelTh: 'ราเมน' },
  { id: 'rice', label: 'Rice Bowls', labelTh: 'ข้าว' },
  { id: 'sides', label: 'Sides', labelTh: 'เซ็ท/ของเสริม' },
  { id: 'drinks', label: 'Drinks', labelTh: 'เครื่องดื่ม' },
]

// ---------------------------------------------------------------------------
// Shared modifier group definitions
// ---------------------------------------------------------------------------

const BROTH_GROUP: MenuModifierGroup = {
  id: 'broth',
  label: 'Broth',
  type: 'single',
  required: true,
  options: [
    { id: 'tonkotsu', label: 'Tonkotsu', priceAdj: 0 },
    { id: 'miso', label: 'Miso', priceAdj: 0 },
    { id: 'shoyu', label: 'Shoyu', priceAdj: 0 },
    { id: 'spicy-miso', label: 'Spicy Miso', priceAdj: 0 },
  ],
}

const NOODLE_FIRMNESS_GROUP: MenuModifierGroup = {
  id: 'noodle-firmness',
  label: 'Noodle Firmness',
  type: 'single',
  required: true,
  options: [
    { id: 'katame', label: 'Firm — Katame', priceAdj: 0 },
    { id: 'futsu', label: 'Regular — Futsu', priceAdj: 0 },
    { id: 'yawaraka', label: 'Soft — Yawaraka', priceAdj: 0 },
  ],
}

const TOPPINGS_GROUP: MenuModifierGroup = {
  id: 'toppings',
  label: 'Toppings',
  type: 'multi',
  required: false,
  options: [
    { id: 'chashu', label: 'Extra Chashu', priceAdj: 30 },
    { id: 'egg', label: 'Soft-boiled Egg', priceAdj: 20 },
    { id: 'corn', label: 'Corn', priceAdj: 15 },
    { id: 'bamboo', label: 'Bamboo Shoots', priceAdj: 10 },
    { id: 'butter', label: 'Butter', priceAdj: 10 },
    { id: 'nori', label: 'Nori', priceAdj: 10 },
  ],
}

const RAMEN_MODIFIER_GROUPS: MenuModifierGroup[] = [
  BROTH_GROUP,
  NOODLE_FIRMNESS_GROUP,
  TOPPINGS_GROUP,
]

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

export const MENU_ITEMS: MenuItem[] = [
  // Ramen
  {
    id: 'tonkotsu-ramen',
    categoryId: 'ramen',
    name: 'Tonkotsu Ramen',
    nameTh: 'โทนโกตสึราเมน',
    basePrice: 290,
    thumbnailPlaceholder: '🍜',
    unsplashId: '1476224203421-9ac39bcb3327',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'miso-ramen',
    categoryId: 'ramen',
    name: 'Miso Ramen',
    nameTh: 'มิโซราเมน',
    basePrice: 280,
    thumbnailPlaceholder: '🍜',
    unsplashId: '1617093727343-374698b1b08d',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'spicy-miso-ramen',
    categoryId: 'ramen',
    name: 'Spicy Miso Ramen',
    nameTh: 'ราเมนมิโซเผ็ด',
    basePrice: 300,
    thumbnailPlaceholder: '🌶️',
    unsplashId: '1547592166-23ac45744acd',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'shoyu-ramen',
    categoryId: 'ramen',
    name: 'Shoyu Ramen',
    nameTh: 'โชยุราเมน',
    basePrice: 270,
    thumbnailPlaceholder: '🍜',
    unsplashId: '1569050467447-ce54b3bbc37d',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  // Rice Bowls
  {
    id: 'chashu-rice',
    categoryId: 'rice',
    name: 'Chashu Rice Bowl',
    nameTh: 'ข้าวหมูชาชู',
    basePrice: 180,
    thumbnailPlaceholder: '🍚',
    unsplashId: '1611143669185-af224c5e3252',
    modifierGroups: [],
  },
  {
    id: 'gyudon',
    categoryId: 'rice',
    name: 'Gyudon',
    nameTh: 'กิวดง',
    basePrice: 200,
    thumbnailPlaceholder: '🥩',
    modifierGroups: [],
  },
  // Sides
  {
    id: 'gyoza',
    categoryId: 'sides',
    name: 'Gyoza (6 pcs)',
    nameTh: 'เกี๊ยวซ่า',
    basePrice: 120,
    thumbnailPlaceholder: '🥟',
    unsplashId: '1432139555190-58524dae6a55',
    modifierGroups: [],
  },
  // Veggie Ramen
  {
    id: 'veggie-ramen',
    categoryId: 'ramen',
    name: 'Veggie Ramen',
    nameTh: 'ราเมนผัก',
    basePrice: 250,
    thumbnailPlaceholder: '🥦',
    unsplashId: '1606755962773-d324e0a13086',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  // Karaage Chicken
  {
    id: 'karaage',
    categoryId: 'sides',
    name: 'Karaage Chicken',
    nameTh: 'ไก่คาราเกะ',
    basePrice: 139,
    thumbnailPlaceholder: '🍗',
    unsplashId: '1504674900247-0877df9cc836',
    modifierGroups: [],
  },
  // Edamame
  {
    id: 'edamame',
    categoryId: 'sides',
    name: 'Edamame',
    nameTh: 'ถั่วแระญี่ปุ่น',
    basePrice: 79,
    thumbnailPlaceholder: '🫘',
    unsplashId: '1482049016688-2d3e1b311543',
    modifierGroups: [],
  },
  // Katsu Don
  {
    id: 'katsu-don',
    categoryId: 'rice',
    name: 'Katsu Don',
    nameTh: 'คัตสึดง',
    basePrice: 220,
    thumbnailPlaceholder: '🍱',
    unsplashId: '1534482421-64566f976cfa',
    modifierGroups: [],
  },
  // Drinks
  {
    id: 'green-tea',
    categoryId: 'drinks',
    name: 'Green Tea',
    nameTh: 'ชาเขียว',
    basePrice: 60,
    thumbnailPlaceholder: '🍵',
    unsplashId: '1556679343-c7306c1976bc',
    modifierGroups: [],
  },
  {
    id: 'iced-coffee',
    categoryId: 'drinks',
    name: 'Iced Coffee',
    nameTh: 'กาแฟเย็น',
    basePrice: 75,
    thumbnailPlaceholder: '☕',
    unsplashId: '1602253057119-44d745d9b860',
    modifierGroups: [],
  },
]
