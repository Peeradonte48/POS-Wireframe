'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Upload, RotateCcw, Store } from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'
import { useMenuStore, DEFAULT_PROFILE } from '@/stores/menu.store'
import {
  importMenuProfile,
  importMenuProfileFromJson,
  MenuImportError,
  type MenuImportFile,
} from '@/lib/menu-import'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BuiltInProfile {
  id: string
  name: string
  nameTh: string
  description: string
  /** When present, fetch+import this JSON; when absent, resetToDefault is used. */
  source?: string
}

const BUILT_IN_PROFILES: BuiltInProfile[] = [
  {
    id: DEFAULT_PROFILE.id,
    name: DEFAULT_PROFILE.name,
    nameTh: DEFAULT_PROFILE.nameTh ?? '',
    description: 'Full ramen menu with custom-ramen modifier groups.',
  },
  {
    id: 'nonna-twist',
    name: 'Nonna Twist',
    nameTh: 'นอนน่า ทวิสต์',
    description: 'Western + Thai comfort menu — 69 items scraped from nonnatwist.com.',
    source: '/profiles/nonna-twist.json',
  },
  {
    id: 'matcha-cafe',
    name: 'Matcha Café',
    nameTh: 'คาเฟ่มัทฉะ',
    description: 'Drinks + desserts with sweetness and milk modifiers.',
    source: '/profiles/matcha-cafe.json',
  },
]

export default function ProfileSettingsPage() {
  const router = useRouter()
  const role = useSessionStore((s) => s.role)
  const activeProfile = useMenuStore((s) => s.profile)
  const loadProfile = useMenuStore((s) => s.loadProfile)
  const resetToDefault = useMenuStore((s) => s.resetToDefault)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (role !== null && role !== 'Manager') {
      router.replace('/table-map')
    }
  }, [role, router])

  if (role !== 'Manager') return null

  async function selectBuiltIn(profile: BuiltInProfile) {
    if (profile.id === activeProfile.id) return
    setLoadingId(profile.id)
    try {
      if (!profile.source) {
        resetToDefault()
        toast.success(`Loaded "${profile.name}"`)
        return
      }
      const res = await fetch(profile.source)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const imported = importMenuProfile((await res.json()) as MenuImportFile)
      loadProfile(imported)
      toast.success(`Loaded "${profile.name}"`)
    } catch (err) {
      if (err instanceof MenuImportError) {
        toast.error(err.issues[0] ?? 'Profile validation failed')
      } else {
        toast.error((err as Error).message)
      }
    } finally {
      setLoadingId(null)
    }
  }

  async function onFilePicked(file: File) {
    setLoadingId('upload')
    try {
      const imported = importMenuProfileFromJson(await file.text())
      loadProfile(imported)
      toast.success(`Loaded "${imported.profile.name}"`)
    } catch (err) {
      if (err instanceof MenuImportError) {
        toast.error(err.issues[0] ?? 'Invalid profile JSON', {
          description: err.issues.slice(1, 3).join('\n'),
        })
      } else {
        toast.error((err as Error).message)
      }
    } finally {
      setLoadingId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b flex items-center px-4 shrink-0">
        <h1 className="text-sm font-semibold">Restaurant Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl w-full mx-auto">
        {/* Active profile banner */}
        <section>
          <p className="caps text-muted-foreground mb-3">Active profile</p>
          <div
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Store size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold leading-6 truncate">{activeProfile.name}</p>
              {activeProfile.nameTh && (
                <p className="text-sm text-muted-foreground truncate">{activeProfile.nameTh}</p>
              )}
            </div>
            <span className="caps text-xs text-muted-foreground">
              {activeProfile.currency} · {activeProfile.locale ?? 'th-TH'}
            </span>
          </div>
        </section>

        {/* Built-in profiles */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="caps text-muted-foreground">Built-in profiles</p>
            {activeProfile.id !== DEFAULT_PROFILE.id && (
              <Button variant="ghost" size="sm" onClick={() => { resetToDefault(); toast.success('Reset to default') }}>
                <RotateCcw size={14} /> Reset to default
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BUILT_IN_PROFILES.map((profile) => {
              const isActive = profile.id === activeProfile.id
              const isLoading = loadingId === profile.id
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => selectBuiltIn(profile)}
                  disabled={isLoading}
                  className={cn(
                    'group text-left rounded-xl border bg-card p-5 transition-all duration-150',
                    isActive
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50 active:scale-[0.99]',
                    isLoading && 'opacity-60 cursor-wait',
                  )}
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold leading-5">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">{profile.nameTh}</p>
                    </div>
                    {isActive && (
                      <span className="shrink-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 leading-5">
                    {profile.description}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Upload custom */}
        <section>
          <p className="caps text-muted-foreground mb-3">Import from JSON</p>
          <div
            className="rounded-xl border border-dashed border-border bg-card p-6 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">Upload a profile file</p>
              <p className="text-sm text-muted-foreground mt-1">
                JSON matching the menu import schema (see docs/specs/2026-04-20-menu-import-schema.md).
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingId === 'upload'}
            >
              <Upload size={16} /> Choose file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFilePicked(file)
              }}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
