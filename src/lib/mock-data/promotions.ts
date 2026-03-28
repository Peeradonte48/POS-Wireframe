export interface Promotion {
  id: string
  title: string
  description: string
  discountPercent: number
  discountFixed: number   // baht amount off subtotal
  validFrom: string       // display string
  validUntil: string      // display string
  imagePlaceholder: string
  imagePath?: string      // real photo path under /public
  referenceCode: string   // mock valid code
}

export const PROMOTIONS: Promotion[] = [
  {
    id: 'promo-001',
    title: 'Welcome Back Ramen',
    description: 'ส่วนลด 15% สำหรับสมาชิกที่กลับมาใช้บริการ',
    discountPercent: 15,
    discountFixed: 0,
    validFrom: '1 มี.ค. 2026',
    validUntil: '31 มี.ค. 2026',
    imagePlaceholder: '🍜',
    imagePath: '/images/promotions/promo-hero.png',
    referenceCode: 'ARAM001',
  },
  {
    id: 'promo-002',
    title: 'Happy Hour',
    description: 'ส่วนลดพิเศษ 20% สำหรับออเดอร์ช่วงบ่าย 14:00–17:00',
    discountPercent: 20,
    discountFixed: 0,
    validFrom: '15 มี.ค. 2026',
    validUntil: '30 เม.ย. 2026',
    imagePlaceholder: '⏰',
    imagePath: '/images/promotions/promo-hero.png',
    referenceCode: 'ARAM002',
  },
  {
    id: 'promo-003',
    title: 'ส่วนลดวันเกิด',
    description: 'ฉลองวันเกิดด้วยส่วนลด ฿50 สำหรับทุกออเดอร์',
    discountPercent: 0,
    discountFixed: 50,
    validFrom: '1 มี.ค. 2026',
    validUntil: '30 เม.ย. 2026',
    imagePlaceholder: '🎂',
    imagePath: '/images/promotions/promo-hero.png',
    referenceCode: 'ARAM003',
  },
  {
    id: 'promo-004',
    title: 'Tonkotsu Premium Deal',
    description: 'ออเดอร์ Tonkotsu หรือ Spicy Tonkotsu ลด 10%',
    discountPercent: 10,
    discountFixed: 0,
    validFrom: '20 มี.ค. 2026',
    validUntil: '20 เม.ย. 2026',
    imagePlaceholder: '🐷',
    imagePath: '/images/promotions/promo-hero.png',
    referenceCode: 'ARAM004',
  },
]
