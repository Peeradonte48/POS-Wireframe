'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Store,
  Package,
  Settings,
  LineChart,
  ChevronRight,
  Download,
  Languages,
  Cable,
  LayoutGrid,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'
import { canAccess, type NavSlug } from '@/lib/role-permissions'

type RealItem = {
  type: 'real'
  /** Used for role-permission filtering */
  slug: NavSlug
  label: string
  description: string
  href: string
  icon: LucideIcon
  /** Show "Soon" badge while item remains navigable */
  comingSoon?: boolean
}

type MockItem = {
  type: 'mock'
  /** Stable key for React */
  key: string
  label: string
  description: string
  icon: LucideIcon
}

type SettingsItem = RealItem | MockItem

interface SettingsSection {
  title: string
  items: SettingsItem[]
}

const SECTIONS: SettingsSection[] = [
  {
    title: 'ร้านและการดำเนินงาน',
    items: [
      {
        type: 'real',
        slug: 'settings',
        label: 'โปรไฟล์ร้าน',
        description: 'ข้อมูลร้าน เมนู และการนำเข้าโปรไฟล์',
        href: '/settings/profile',
        icon: Store,
      },
      {
        type: 'mock',
        key: 'table-configuration',
        label: 'Table Configuration',
        description: 'จัดผังโต๊ะ จำนวนที่นั่ง และโซน',
        icon: LayoutGrid,
      },
      {
        type: 'real',
        slug: 'kds',
        label: 'ครัว (KDS)',
        description: 'หน้าจอแสดงคำสั่งสำหรับห้องครัว',
        href: '/kds',
        icon: Package,
        comingSoon: true,
      },
      {
        type: 'mock',
        key: 'hardware-setup',
        label: 'Hardware Setup',
        description: 'เครื่องพิมพ์ ลิ้นชักเงินสด และเครื่องสแกน',
        icon: Cable,
      },
    ],
  },
  {
    title: 'รายงานและจัดการ',
    items: [
      {
        type: 'real',
        slug: 'manager',
        label: 'ผู้จัดการ',
        description: 'ปิดกะ ตรวจสอบยอด และจัดการรายการ 86',
        href: '/manager',
        icon: Settings,
      },
      {
        type: 'real',
        slug: 'dashboard',
        label: 'แดชบอร์ด',
        description: 'รายงานยอดขาย และเมตริกของร้าน',
        href: '/dashboard',
        icon: LineChart,
        comingSoon: true,
      },
    ],
  },
  {
    title: 'ทั่วไป',
    items: [
      {
        type: 'mock',
        key: 'notification',
        label: 'Notification',
        description: 'ตั้งค่าการแจ้งเตือนและเสียง',
        icon: Bell,
      },
      {
        type: 'mock',
        key: 'language',
        label: 'Language',
        description: 'ภาษาของแอป (ไทย / English)',
        icon: Languages,
      },
      {
        type: 'mock',
        key: 'app-update',
        label: 'App Update',
        description: 'ตรวจสอบและติดตั้งเวอร์ชันล่าสุด',
        icon: Download,
      },
    ],
  },
]

export default function SettingsHubPage() {
  const router = useRouter()
  const { role } = useSessionStore()

  function isVisible(item: SettingsItem): boolean {
    if (item.type === 'real') {
      return Boolean(role && canAccess(role, item.slug))
    }
    // Mock items always render — they're previewable for everyone.
    return true
  }

  function handleClick(item: SettingsItem) {
    if (item.type === 'real' && !item.comingSoon) {
      router.push(item.href)
      return
    }
    toast(`${item.label} — เร็วๆ นี้`, {
      description: item.description,
    })
  }

  const visibleSections = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter(isVisible),
  })).filter((s) => s.items.length > 0)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-foreground">ตั้งค่า</h1>
        <p className="text-sm text-muted-foreground">เลือกหัวข้อที่ต้องการจัดการ</p>

        <div className="mt-6 flex flex-col gap-6">
          {visibleSections.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {section.title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isMock = item.type === 'mock'
                  const showSoonBadge = isMock || (item.type === 'real' && item.comingSoon)
                  const key = item.type === 'real' ? item.slug : item.key
                  return (
                    <button
                      key={key}
                      onClick={() => handleClick(item)}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent active:scale-[0.99]"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base font-semibold text-foreground truncate">
                              {item.label}
                            </span>
                            {showSoonBadge && (
                              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                Soon
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-muted-foreground/60 shrink-0 transition-transform group-hover:translate-x-0.5"
                          />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground leading-5">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {visibleSections.length === 0 && (
          <div className="mt-8 rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            ไม่มีหัวข้อตั้งค่าที่คุณมีสิทธิ์เข้าถึง
          </div>
        )}
      </div>
    </div>
  )
}
