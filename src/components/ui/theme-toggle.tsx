'use client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
// Use sun/moon text labels for now — Solar icons added in Plan 02
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
      <span className="text-sm select-none dark:hidden">&#9728;</span>
      <span className="text-sm select-none hidden dark:inline">&#9790;</span>
    </Button>
  )
}
