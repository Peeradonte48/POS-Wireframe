# Phase 9: Flow Alignment - Research

**Researched:** 2026-03-12
**Domain:** React / Next.js UI surgery — five targeted component changes to align wireframe with v1.1 user flow spec
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**FLOW-01 — Guest count (Open Table)**
- The guest count field in `OpenTableModal` must start **empty** (not pre-filled with 1)
- The "Open Table" confirm button stays disabled until the staff actively types a number >= 1
- Current pre-fill of `1` is incorrect — forces active entry to match "must fill" intent

**FLOW-02 — Served button**
- The "Served" button and `markServed()` implementation are already correct
- One addition needed: after tapping Served, the table bottom sheet should show **"Served at HH:MM"** so staff can see the recorded service time
- Display format: localized time string, shown inline in the Occupied sheet content

**FLOW-03 — Camera scan for coupon QR**
- **Replace** the manual coupon code text input with a **"Scan Coupon QR" button** — no text input at all
- Tapping the button opens a **bottom sheet** with a simulated camera viewfinder:
  - Animated camera rectangle (CSS animation is fine)
  - Label: "Point at customer's coupon QR code"
  - **X button** in the top-right corner to dismiss without applying a coupon
  - Auto-closes after ~1.5 seconds simulating a successful scan
- Mock scan result: coupon code **'RAMEN50'**, discount **฿50**
- After scan: Scan button stays visible but is **disabled** (grayed out) — makes it clear a scan already happened
- Applied coupon shows as a line item in TotalsSection: "RAMEN50 −฿50"

**FLOW-04 — Dynamic QR after coupon scan**
- No new QR flow needed — this uses the **existing QR PromptPay path**
- The `grandTotal` prop already passes the post-discount net amount to `QrPanel`
- One enhancement: when a coupon was applied AND QR PromptPay is selected, `QrPanel` should show the net amount with a discount note — e.g. **"฿920 (after ฿50 discount)"** — so staff can confirm with the customer
- `QrPanel` should accept an optional `discountApplied?: number` prop to conditionally render this label

**FLOW-05 — Loyalty QR + member info on receipt**
- A **loyalty section** appears on `ReceiptScreen` **below the payment details card**, above the action buttons (Reprint / Back to Floor)
- Staff-facing mock data: **"Gold Member | 1,240 pts"** (static mock — realistic for stakeholder demos)
- Below the member info: a **QR placeholder box** with label **"Customer scans to earn points"**
- Annotation text: `[Smart loyalty QR — unique per bill, baked with spend + branch]`
- This is the CRM Type 2 (smart loyalty) flow — no manual phone entry required

### Claude's Discretion
- Exact CSS animation style for the camera viewfinder scanning effect
- Exact visual styling of the loyalty card (border, background, icon treatment)
- Whether to use a Solar icon for the camera scan button (e.g. `CameraLinear` or similar)
- QR placeholder visual (solid box, dashed border, or SVG pattern)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FLOW-01 | Open Table sheet captures guest count to start table usage tracking | `OpenTableModal` state change: `useState(1)` → `useState<number \| ''>('')`; confirm button disabled condition change |
| FLOW-02 | Staff can tap "Served" on the tablet after delivering food + invoice to record actual service start time | `TableBottomSheet` already calls `markServed()` which writes `servedAt: Date.now()` to store; add display row using `table.servedAt` |
| FLOW-03 | Payment screen lets staff scan customer QR coupon with back camera, within the POS app (no app switching) | Replace `TotalsSection` coupon input JSX with scan button + new camera-viewfinder bottom sheet component |
| FLOW-04 | After coupon scan, system displays a Dynamic QR Code with net amount for customer to scan and pay | Extend `QrPanel` with `discountApplied?: number` optional prop; render conditional label when prop > 0 |
| FLOW-05 | Receipt state shows a smart QR code (CRM loyalty Type 2); POS displays member tier + point balance during checkout | Add loyalty section block to `ReceiptScreen` JSX between the details card and action buttons |
</phase_requirements>

---

## Summary

Phase 9 is pure UI surgery on five existing components. No new routes, no new stores, no new architectural concepts. The gaps between the v1.1 user flow spec and the current wireframe are: one state default value (FLOW-01), one display addition (FLOW-02), one interaction replacement + new bottom sheet (FLOW-03), one prop extension + conditional label (FLOW-04), and one new JSX block (FLOW-05).

All five tasks are self-contained within their target files. The largest single change is FLOW-03, which introduces a new camera-viewfinder bottom sheet component following the already-established bottom sheet slide-up pattern. Everything else is additive or a small state/prop change.

The existing codebase provides all necessary infrastructure: `servedAt: number | null` already lives in the table store and is written by `markServed()`, `grandTotal` already flows through to `QrPanel`, the coupon apply logic is already in place, and the bottom sheet pattern is already in `TableBottomSheet.tsx`.

**Primary recommendation:** Execute five sequential tasks, each scoped to one file group. All changes are additive or corrective — no refactors, no store changes, no new routes.

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 15 (App Router) | Page/component framework | Locked — use as-is |
| TypeScript | 5 strict | Type safety | Locked — use as-is |
| Tailwind CSS | 4 | Utility styling | Locked — use as-is |
| Zustand | 5 + persist | State management | Locked — all store changes use existing pattern |
| solar-icon-set | 2.0.1 | Icon set | Available — `CameraLinear` for scan button |
| sonner | existing | Toast notifications | Already used in all component files |

### No New Dependencies
This phase installs nothing. All work uses libraries already present.

**Import pattern (confirmed in codebase):**
```typescript
import { CameraLinear } from 'solar-icon-set'
import { ClockCircleLinear } from 'solar-icon-set'  // already used in TableBottomSheet
```

---

## Architecture Patterns

### Established Patterns to Follow

**Bottom sheet (slide-up with backdrop)**
Already used in `TableBottomSheet.tsx`. The camera viewfinder sheet for FLOW-03 must follow the same pattern exactly:
```tsx
// Backdrop
<div className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />

// Panel
<div className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background shadow-lg transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}>
```
Z-index: backdrop at z-40, panel at z-50 — same as `TableBottomSheet`.

**Annotation pattern**
Used throughout payment screen for wireframe annotations:
```tsx
<p className="text-xs text-muted-foreground">[annotation text]</p>
```

**Wireframe "disabled after action" pattern**
Already used for Split Bill button — `disabled` + `opacity-50`. The scan button after scanning follows this: stays visible, grayed out.

**Conditional prop rendering**
`QrPanel` already receives `grandTotal` from the page. Adding an optional prop is the standard TypeScript pattern:
```typescript
interface QrPanelProps {
  grandTotal: number
  discountApplied?: number  // new — only render label when > 0
}
```

**Locale time formatting**
`ReceiptScreen` already uses `toLocaleString('th-TH')`. FLOW-02 "Served at HH:MM" must use the same:
```typescript
new Date(table.servedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
```

### Recommended Project Structure (unchanged)
No new directories. New component:
```
src/
└── components/
    └── payment/
        ├── TotalsSection.tsx        # FLOW-03: replace coupon input
        ├── QrPanel.tsx              # FLOW-04: add discountApplied prop
        ├── ReceiptScreen.tsx        # FLOW-05: add loyalty section
        └── CameraSheet.tsx          # FLOW-03: new camera viewfinder sheet (or inline in TotalsSection)
```

The camera sheet is small enough to live inline in `TotalsSection.tsx`. Extracting to `CameraSheet.tsx` is also valid — Claude's discretion.

### CSS Animation for Camera Viewfinder
No animation library needed. Use Tailwind `animate-pulse` on the scan-line/border, or a simple `@keyframes` via Tailwind's arbitrary `animate-[...]` syntax. A pulsing border (`animate-pulse border-2 border-primary`) on the viewfinder box is the minimal viable approach.

### Anti-Patterns to Avoid
- **Do not use `<Dialog>` (Base UI) for the camera sheet** — the project uses its own slide-up div pattern for bottom sheets, not the Base UI Dialog component. Dialog is used only for `OpenTableModal` because it has `disablePointerDismissal`.
- **Do not add new Zustand store fields** — `servedAt` already exists; `couponCode`/`couponAmount`/`couponApplied` already live as local `useState` in the payment page. No store changes needed.
- **Do not thread coupon state through new props to TotalsSection parent** — the scan result ('RAMEN50', 50) should be delivered by calling `setCouponCode('RAMEN50')` and `setCouponAmount(50)` and `setCouponApplied(true)` — the same callbacks already passed from the payment page.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Countdown/auto-close timer | Custom interval management | `setTimeout` in `useEffect` with cleanup | Single-purpose, 1.5s fire-once — no library needed |
| Slide-up animation | Custom spring physics | Tailwind `transition-transform duration-300 ease-out` | Already proven in TableBottomSheet |
| Time formatting | Custom formatter | `Date.toLocaleTimeString('th-TH', ...)` | Already used in ReceiptScreen |
| Camera viewfinder animation | Canvas/WebRTC | CSS `animate-pulse` or `@keyframes scan-line` | Wireframe — simulated, not real camera |

---

## Common Pitfalls

### Pitfall 1: useState type for empty guest count
**What goes wrong:** `useState<number>('')` TypeScript error — empty string is not a number.
**Why it happens:** The input needs to show empty initially but the value type needs to satisfy `input[type=number]`.
**How to avoid:** `useState<number | ''>('')` — the union type allows the empty string sentinel. Confirm button disabled check: `guestCount === '' || guestCount < 1`.

### Pitfall 2: `useEffect` cleanup on the auto-close timer
**What goes wrong:** If the camera sheet closes before 1.5s (user taps X), the setTimeout still fires and calls `setCouponApplied(true)` on an already-dismissed sheet.
**Why it happens:** setTimeout doesn't know the sheet was dismissed.
**How to avoid:** Return a cleanup from `useEffect`: `return () => clearTimeout(timerId)`. Clear on unmount or when `scannerOpen` state becomes false.

### Pitfall 3: `servedAt` rendering before Served is tapped
**What goes wrong:** Showing "Served at —" or an invalid time before `servedAt` is set.
**Why it happens:** `table.servedAt` is `null` until `markServed()` is called.
**How to avoid:** Conditional render: only show the "Served at HH:MM" line when `table.servedAt !== null`. While null, the row simply doesn't appear.

### Pitfall 4: `discountApplied` prop vs `discountAmount` page state naming collision
**What goes wrong:** Both `QrPanel`'s new prop and the payment page's existing `discountAmount` local state describe the same value — easy to confuse.
**Why it happens:** The payment page already has `const discountAmount = couponApplied ? couponAmount : 0`. Passing this as `discountApplied` to QrPanel is correct but naming differs.
**How to avoid:** Pass `discountApplied={discountAmount}` at the call site — explicit and clear. The prop name on QrPanel is `discountApplied`; the page state is `discountAmount`. Document the mapping at the call site with a comment.

### Pitfall 5: Camera sheet z-index conflict with payment page header
**What goes wrong:** Camera sheet slides up but appears behind the sticky header (z-index: header is at some level; sheet backdrop at z-40 may conflict).
**Why it happens:** Payment page header uses `<header>` — if it has no explicit z-index, it defaults to 0 and causes no conflict. But if a sticky header has `z-10`, the sheet's z-40/z-50 still wins.
**How to avoid:** Match the same z-40/z-50 pattern from `TableBottomSheet` — already confirmed to work in the app.

---

## Code Examples

Verified patterns from existing codebase:

### FLOW-01: Guest count empty initial state
```typescript
// OpenTableModal.tsx — change these two lines
const [guestCount, setGuestCount] = useState<number | ''>('' )

// In useEffect reset:
setGuestCount('')

// Confirm button disabled condition:
disabled={guestCount === '' || (typeof guestCount === 'number' && guestCount < 1)}

// handleConfirm guard:
if (typeof guestCount === 'number' && guestCount >= 1 && tableId) { ... }
```

### FLOW-02: Served at display in Occupied sheet
```typescript
// TableBottomSheet.tsx — add after the orderStage badge block, inside 'Occupied' section
{table.servedAt !== null && (
  <p className="text-sm text-muted-foreground">
    Served at {new Date(table.servedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
  </p>
)}
```

### FLOW-03: Scan button replacing coupon inputs in TotalsSection
```typescript
// TotalsSection.tsx — props change: remove setCouponCode, setCouponAmount, onApplyCoupon
// Add: onScanCoupon: () => void (called by parent to trigger scan sheet)
// Or: the scan sheet lives entirely inside TotalsSection as local state

// Scan button (when not yet applied):
<Button variant="outline" className="w-full" onClick={() => setScannerOpen(true)}>
  <CameraLinear size={16} className="mr-2" />
  Scan Coupon QR
</Button>

// Scan button (after scan — disabled):
<Button variant="outline" className="w-full" disabled>
  <CameraLinear size={16} className="mr-2" />
  Scan Coupon QR
</Button>
```

### FLOW-03: Camera viewfinder bottom sheet
```typescript
// Follows TableBottomSheet.tsx slide-up pattern exactly
// Auto-close useEffect:
useEffect(() => {
  if (!scannerOpen) return
  const id = setTimeout(() => {
    // mock successful scan
    onCouponScanned('RAMEN50', 50)
    setScannerOpen(false)
  }, 1500)
  return () => clearTimeout(id)
}, [scannerOpen])
```

### FLOW-04: QrPanel with discount note
```typescript
// QrPanel.tsx — prop addition
interface QrPanelProps {
  grandTotal: number
  discountApplied?: number
}

// Conditional label below the amount:
{discountApplied && discountApplied > 0 && (
  <p className="text-sm text-muted-foreground">
    (after ฿{discountApplied.toLocaleString()} discount)
  </p>
)}

// Call site in payment page:
{paymentMethod === 'QR PromptPay' && (
  <QrPanel grandTotal={grandTotal} discountApplied={discountAmount} />
)}
```

### FLOW-05: Loyalty section in ReceiptScreen
```typescript
// ReceiptScreen.tsx — new block between details card and actions
<div className="rounded-xl border bg-card p-4 w-full max-w-sm space-y-3">
  {/* Member info */}
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">Gold Member</span>
    <span className="text-sm text-muted-foreground">1,240 pts</span>
  </div>

  {/* QR placeholder */}
  <div className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center">
    <span className="text-xs text-muted-foreground text-center">Customer scans to earn points</span>
  </div>

  {/* Annotation */}
  <p className="text-xs text-muted-foreground text-center">
    [Smart loyalty QR — unique per bill, baked with spend + branch]
  </p>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | Change | Impact |
|--------------|------------------|--------|--------|
| Manual coupon code text entry (two inputs + Apply button) | Single "Scan Coupon QR" button + camera viewfinder bottom sheet | Phase 9 change | Staff never types coupon code; scan simulates real tablet back-camera workflow |
| Guest count pre-filled with `1` | Guest count starts empty, disabled confirm until entry | Phase 9 change | Enforces active staff entry, matches "must fill" intent |
| No served-time display | "Served at HH:MM" shown inline after tapping Served | Phase 9 change | Staff can see service start time without checking store |
| QR shows only grand total | QR shows grand total with discount note when coupon applied | Phase 9 change | Staff can confirm net amount with customer at payment |
| Receipt has no loyalty section | Receipt has Gold Member info + QR placeholder | Phase 9 change | Completes CRM Type 2 loyalty wireframe story |

---

## Open Questions

1. **Where does camera sheet state live: inside TotalsSection or lifted to payment page?**
   - What we know: `setCouponCode`, `setCouponAmount`, `setCouponApplied` currently live as callbacks passed down from the payment page to `TotalsSection`. The scan result needs to fire these callbacks.
   - What's unclear: Whether to keep the camera sheet entirely inside `TotalsSection` (self-contained) or expose an `onScanCoupon` callback.
   - Recommendation: Keep the camera sheet local to `TotalsSection` as internal state. The mock scan result calls the existing `onApplyCoupon` / `setCouponCode` / `setCouponAmount` callbacks. This avoids lifting more state to the already-complex payment page.

2. **Should TotalsSection props change signature?**
   - What we know: Current props include `setCouponCode`, `setCouponAmount`, `couponCode`, `couponAmount` which were for the manual input. These become unused if the input is removed.
   - Recommendation: Keep the callbacks in `TotalsSection` props but delete the rendered inputs. The parent page still owns coupon state. The scan result calls the same setters. This minimizes change to the payment page call site.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | None — no jest.config, vitest.config, or playwright.config |
| Quick run command | `npm run build` (TypeScript compile check) |
| Full suite command | `npm run build && npm run lint` |

No automated test framework is installed in this project. The build and lint pipeline serves as the validation gate.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-01 | Guest count input starts empty; confirm disabled until >= 1 entered | manual-only | `npm run build` (type-checks the state change) | N/A |
| FLOW-02 | "Served at HH:MM" appears after tapping Served | manual-only | `npm run build` | N/A |
| FLOW-03 | Scan button opens camera sheet; sheet auto-closes after 1.5s; coupon applied | manual-only | `npm run build` | N/A |
| FLOW-04 | QrPanel shows discount note when coupon applied + QR PromptPay selected | manual-only | `npm run build` | N/A |
| FLOW-05 | Loyalty section visible on ReceiptScreen with mock member data + QR placeholder | manual-only | `npm run build` | N/A |

Manual-only justification: This is an interactive Hi-Fi wireframe with no test framework installed. UI interaction flows (button tap → sheet open → auto-close → coupon applied) require visual browser verification.

### Sampling Rate
- **Per task commit:** `npm run build` — TypeScript compile confirms no type errors
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build green + manual walkthrough of all five flows before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure to create. Build + lint is the existing validation mechanism for this project.

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/components/table-map/OpenTableModal.tsx` — confirmed `useState(1)`, exact state change required
- Direct source read: `src/components/table-map/TableBottomSheet.tsx` — confirmed `markServed()` call at line 166, `servedAt` display location, bottom sheet pattern
- Direct source read: `src/components/payment/TotalsSection.tsx` — confirmed current coupon input block to replace
- Direct source read: `src/components/payment/QrPanel.tsx` — confirmed current props interface, exact prop extension needed
- Direct source read: `src/components/payment/ReceiptScreen.tsx` — confirmed layout structure, insertion point for loyalty section
- Direct source read: `src/stores/table.store.ts` — confirmed `servedAt: number | null` field exists, `markServed()` writes `Date.now()`
- Direct source read: `src/app/(app)/payment/[tableId]/page.tsx` — confirmed coupon state ownership, QrPanel call site
- Direct source read: `solar-icon-set@2.0.1` package present — `CameraLinear` available

### Secondary (MEDIUM confidence)
- `.planning/phases/09-flow-alignment/09-CONTEXT.md` — all implementation decisions from user discussion, used verbatim

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed via direct source reads and package inspection
- Architecture: HIGH — all patterns traced directly from existing production code in the repository
- Pitfalls: HIGH — each pitfall derived from reading actual code (state types, prop names, z-index usage)
- Code examples: HIGH — all snippets are minimal extensions of confirmed existing code

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable project, no fast-moving dependencies)
