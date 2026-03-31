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
  icon?: string   // emoji shown before label
  options: MenuModifierOption[]
  /** Option ids pre-selected as the base/standard choice for new orders */
  defaultOptionIds?: string[]
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  nameTh: string
  basePrice: number
  thumbnailPlaceholder: string
  /** Prefer local /public image over unsplashId when set */
  imagePath?: string
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
  { id: 'ramen', label: 'ราเมน', labelTh: 'ราเมน' },
  { id: 'rice', label: 'ข้าวหน้า', labelTh: 'ข้าวหน้า' },
  { id: 'sides', label: 'เครื่องเคียง', labelTh: 'เครื่องเคียง' },
  { id: 'drinks', label: 'เครื่องดื่ม', labelTh: 'เครื่องดื่ม' },
]

// ---------------------------------------------------------------------------
// Shared modifier group definitions — A Ramen actual customisation
// ---------------------------------------------------------------------------

const RAMEN_MODIFIER_GROUPS: MenuModifierGroup[] = [
  {
    id: 'noodle-firmness',
    label: 'ระดับความนุ่มของเส้น',
    icon: '🍜',
    type: 'single',
    required: true,
    defaultOptionIds: ['normal'],
    options: [
      { id: 'very-soft',   label: 'นุ่มมาก',  priceAdj: 0 },
      { id: 'soft',        label: 'นุ่ม',      priceAdj: 0 },
      { id: 'normal',      label: 'ปกติ',      priceAdj: 0 },
      { id: 'firm',        label: 'แข็ง',      priceAdj: 0 },
      { id: 'very-firm',   label: 'แข็งมาก',  priceAdj: 0 },
    ],
  },
  {
    id: 'broth-richness',
    label: 'ความเข้มข้นของน้ำซุป',
    icon: '🥣',
    type: 'single',
    required: true,
    defaultOptionIds: ['medium'],
    options: [
      { id: 'light',    label: 'เข้มข้นน้อย',  priceAdj: 0 },
      { id: 'medium',   label: 'ปานกลาง',       priceAdj: 0 },
      { id: 'rich',     label: 'เข้มข้นมาก',   priceAdj: 0 },
    ],
  },
  {
    id: 'chashu',
    label: 'หมูชาชู',
    icon: '🥩',
    type: 'single',
    required: true,
    defaultOptionIds: ['fatty'],
    options: [
      { id: 'no-pork',    label: 'ไม่ใส่หู (ได้เส้นเพิ่ม)', priceAdj: 0 },
      { id: 'fatty',      label: 'หมูติดมัน',               priceAdj: 0 },
      { id: 'lean',       label: 'หมูไม่ติดมัน',            priceAdj: 0 },
    ],
  },
  {
    id: 'onion',
    label: 'ต้นหอม, ต้นหอมขาวญี่ปุ่น',
    icon: '🌿',
    type: 'multi',
    required: true,
    defaultOptionIds: ['both'],
    options: [
      { id: 'none',      label: 'ไม่ใส่เลย',           priceAdj: 0 },
      { id: 'white',     label: 'ต้นหอมขาวญี่ปุ่น',    priceAdj: 0 },
      { id: 'green',     label: 'ต้นหอมเขียว',          priceAdj: 0 },
      { id: 'both',      label: 'ใส่ทั้ง 2 แบบ',        priceAdj: 0 },
    ],
  },
  {
    id: 'spice-level',
    label: 'ระดับความเผ็ด',
    icon: '🌶️',
    type: 'single',
    required: true,
    defaultOptionIds: ['no-spice'],
    options: [
      { id: 'no-spice', label: 'ไม่เผ็ดเลย', priceAdj: 0 },
      { id: 'x1',       label: 'x1',          priceAdj: 0 },
      { id: 'x2',       label: 'x2',          priceAdj: 0 },
      { id: 'x3',       label: 'x3',          priceAdj: 0 },
      { id: 'xmax',     label: 'x....',       priceAdj: 0 },
    ],
  },
  {
    id: 'garlic',
    label: 'กระเทียม',
    icon: '🧄',
    type: 'single',
    required: true,
    defaultOptionIds: ['1tsp'],
    options: [
      { id: 'none',  label: 'ไม่ใส่เลย',  priceAdj: 0 },
      { id: '1tsp',  label: '1 ช้อนชา',   priceAdj: 0 },
      { id: '2tsp',  label: '2 ช้อนชา',   priceAdj: 0 },
      { id: 'more',  label: '...ช้อนชา',  priceAdj: 0 },
    ],
  },
  {
    id: 'broth-oil',
    label: 'ความมันของน้ำซุป',
    icon: '🫙',
    type: 'single',
    required: true,
    defaultOptionIds: ['normal'],
    options: [
      { id: 'none',    label: 'ไม่ใส่',  priceAdj: 0 },
      { id: 'light',   label: 'น้อย',    priceAdj: 0 },
      { id: 'normal',  label: 'ปกติ',    priceAdj: 0 },
      { id: 'rich',    label: 'เยอะ',    priceAdj: 0 },
    ],
  },
]

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

export const MENU_ITEMS: MenuItem[] = [
  // ── ราเมน ──────────────────────────────────────────────────────────────────
  {
    id: 'ramen-signature',
    categoryId: 'ramen',
    name: 'ราเมง สูตรต้นตำรับ',
    nameTh: 'ราเมง สูตรต้นตำรับ',
    basePrice: 290,
    thumbnailPlaceholder: '🍜',
    imagePath: '/menu/ramen-signature.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'ramen-exam',
    categoryId: 'ramen',
    name: 'ราเมงข้อสอบ',
    nameTh: 'ราเมงข้อสอบ',
    basePrice: 290,
    thumbnailPlaceholder: '🍜',
    imagePath: '/menu/ramen-exam.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'cold-noodle',
    categoryId: 'ramen',
    name: 'บะหมี่เย็น',
    nameTh: 'บะหมี่เย็น',
    basePrice: 290,
    thumbnailPlaceholder: '🍜',
    imagePath: '/menu/cold-noodle.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'cold-udon',
    categoryId: 'ramen',
    name: 'อุด้งเย็น (เส้นเล็ก)',
    nameTh: 'อุด้งเย็น (เส้นเล็ก)',
    basePrice: 280,
    thumbnailPlaceholder: '🍜',
    imagePath: '/menu/cold-udon.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'cold-soba',
    categoryId: 'ramen',
    name: 'โซบะเย็น',
    nameTh: 'โซบะเย็น',
    basePrice: 300,
    thumbnailPlaceholder: '🍜',
    imagePath: '/menu/cold-soba.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'vegan-ramen',
    categoryId: 'ramen',
    name: 'ราเมนเจ',
    nameTh: 'ราเมนเจ',
    basePrice: 250,
    thumbnailPlaceholder: '🥦',
    imagePath: '/menu/vegan-ramen.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'curry-ramen',
    categoryId: 'ramen',
    name: 'ราเมนแกง',
    nameTh: 'ราเมนแกง',
    basePrice: 320,
    thumbnailPlaceholder: '🍜',
    imagePath: '/menu/curry-ramen.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'seafood-ramen',
    categoryId: 'ramen',
    name: 'ราเมนซีฟู้ด',
    nameTh: 'ราเมนซีฟู้ด',
    basePrice: 350,
    thumbnailPlaceholder: '🦐',
    imagePath: '/menu/seafood-ramen.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  {
    id: 'spicy-tonkotsu',
    categoryId: 'ramen',
    name: 'ราเมนทงคตสึเผ็ด',
    nameTh: 'ราเมนทงคตสึเผ็ด',
    basePrice: 310,
    thumbnailPlaceholder: '🌶️',
    imagePath: '/menu/spicy-tonkotsu.jpg',
    modifierGroups: RAMEN_MODIFIER_GROUPS,
  },
  // ── ข้าวหน้า ───────────────────────────────────────────────────────────────
  {
    id: 'chashu-rice',
    categoryId: 'rice',
    name: 'ข้าวหมูชาชู',
    nameTh: 'ข้าวหมูชาชู',
    basePrice: 180,
    thumbnailPlaceholder: '🍚',
    unsplashId: '1611143669185-af224c5e3252',
    modifierGroups: [],
  },
  {
    id: 'katsu-don',
    categoryId: 'rice',
    name: 'คัตสึดง',
    nameTh: 'คัตสึดง',
    basePrice: 220,
    thumbnailPlaceholder: '🍱',
    unsplashId: '1534482421-64566f976cfa',
    modifierGroups: [],
  },
  {
    id: 'oyako-don',
    categoryId: 'rice',
    name: 'โอยาโกะดง',
    nameTh: 'โอยาโกะดง',
    basePrice: 200,
    thumbnailPlaceholder: '🥚',
    unsplashId: '1569050467447-ce54b3bbc37d',
    modifierGroups: [],
  },
  // ── เครื่องเคียง ────────────────────────────────────────────────────────────
  {
    id: 'gyoza',
    categoryId: 'sides',
    name: 'เกี๊ยวซ่า (6 ชิ้น)',
    nameTh: 'เกี๊ยวซ่า (6 ชิ้น)',
    basePrice: 120,
    thumbnailPlaceholder: '🥟',
    unsplashId: '1432139555190-58524dae6a55',
    modifierGroups: [],
  },
  {
    id: 'karaage',
    categoryId: 'sides',
    name: 'ไก่คาราเกะ',
    nameTh: 'ไก่คาราเกะ',
    basePrice: 139,
    thumbnailPlaceholder: '🍗',
    unsplashId: '1504674900247-0877df9cc836',
    modifierGroups: [],
  },
  {
    id: 'edamame',
    categoryId: 'sides',
    name: 'ถั่วแระญี่ปุ่น',
    nameTh: 'ถั่วแระญี่ปุ่น',
    basePrice: 79,
    thumbnailPlaceholder: '🫘',
    unsplashId: '1482049016688-2d3e1b311543',
    modifierGroups: [],
  },
  // ── เครื่องดื่ม ─────────────────────────────────────────────────────────────
  {
    id: 'green-tea',
    categoryId: 'drinks',
    name: 'ชาเขียว',
    nameTh: 'ชาเขียว',
    basePrice: 60,
    thumbnailPlaceholder: '🍵',
    unsplashId: '1556679343-c7306c1976bc',
    modifierGroups: [],
  },
  {
    id: 'iced-coffee',
    categoryId: 'drinks',
    name: 'กาแฟเย็น',
    nameTh: 'กาแฟเย็น',
    basePrice: 75,
    thumbnailPlaceholder: '☕',
    unsplashId: '1602253057119-44d745d9b860',
    modifierGroups: [],
  },
  {
    id: 'cola',
    categoryId: 'drinks',
    name: 'โคล่า',
    nameTh: 'โคล่า',
    basePrice: 50,
    thumbnailPlaceholder: '🥤',
    modifierGroups: [],
  },
]
