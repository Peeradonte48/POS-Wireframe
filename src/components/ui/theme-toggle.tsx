'use client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { SunLinear, MoonLinear } from 'solar-icon-set'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <SunLinear size={16} className="dark:hidden" />
      <MoonLinear size={16} className="hidden dark:block" />
    </Button>
  )
}
