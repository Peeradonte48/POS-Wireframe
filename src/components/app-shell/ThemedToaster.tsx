'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme as 'light' | 'dark' | 'system'}
      toastOptions={{
        style: {
          padding: '16px',
          gap: '8px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          boxShadow: 'var(--shadow-panel)',
          fontSize: '14px',
          lineHeight: '20px',
          alignItems: 'flex-start',
          '--success-color': '#16a34a',
          '--success-bg': '#16a34a',
        } as React.CSSProperties,
        classNames: {
          title: 'font-medium text-sm leading-[20px]',
          description: 'text-sm leading-[20px] !text-[var(--muted-foreground)]',
          icon: '!size-[20px] !m-0 shrink-0',
          success: '[&_svg]:!text-[#16a34a]',
          actionButton: '!h-6 !px-4 !rounded-md !border !border-[var(--input)] !bg-[var(--card)] !text-sm !font-medium !text-[var(--foreground)] !shadow-none',
        },
      }}
    />
  )
}
