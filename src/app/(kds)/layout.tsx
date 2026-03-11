// Server component — no AppShell, no sidebar, no top nav.
// Provides full-screen canvas for KDS route group only.

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {children}
    </div>
  )
}
