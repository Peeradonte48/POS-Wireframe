# Phase 9: Flow Alignment - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the five staff-facing interactions from the CLAUDE.md v1.1 user flow spec into the wireframe. No new features — only gaps between the spec and the current implementation. FLOW-01 and FLOW-02 need small corrections; FLOW-03, FLOW-04, FLOW-05 need new UI built.

</domain>

<decisions>
## Implementation Decisions

### FLOW-01 — Guest count (Open Table)
- The guest count field in `OpenTableModal` must start **empty** (not pre-filled with 1)
- The "Open Table" confirm button stays disabled until the staff actively types a number ≥ 1
- Current pre-fill of `1` is incorrect — forces active entry to match "must fill" intent

### FLOW-02 — Served button
- The "Served" button and `markServed()` implementation are already correct
- One addition needed: after tapping Served, the table bottom sheet should show **"Served at HH:MM"** so staff can see the recorded service time
- Display format: localized time string, shown inline in the Occupied sheet content

### FLOW-03 — Camera scan for coupon QR
- **Replace** the manual coupon code text input with a **"📷 Scan Coupon QR" button** — no text input at all
- Tapping the button opens a **bottom sheet** with a simulated camera viewfinder:
  - Animated camera rectangle (CSS animation is fine)
  - Label: "Point at customer's coupon QR code"
  - **X button** in the top-right corner to dismiss without applying a coupon
  - Auto-closes after ~1.5 seconds simulating a successful scan
- Mock scan result: coupon code **'RAMEN50'**, discount **฿50**
- After scan: Scan button stays visible but is **disabled** (grayed out) — makes it clear a scan already happened
- Applied coupon shows as a line item in TotalsSection: "RAMEN50 −฿50"

### FLOW-04 — Dynamic QR after coupon scan
- No new QR flow needed — this uses the **existing QR PromptPay path**
- The `grandTotal` prop already passes the post-discount net amount to `QrPanel`
- One enhancement: when a coupon was applied AND QR PromptPay is selected, `QrPanel` should show the net amount with a discount note — e.g. **"฿920 (after ฿50 discount)"** — so staff can confirm with the customer
- `QrPanel` should accept an optional `discountApplied?: number` prop to conditionally render this label

### FLOW-05 — Loyalty QR + member info on receipt
- A **loyalty section** appears on `ReceiptScreen` **below the payment details card**, above the action buttons (Reprint / Back to Floor)
- Staff-facing mock data: **"Gold Member ⭐⭐⭐ | 1,240 pts"** (static mock — realistic for stakeholder demos)
- Below the member info: a **QR placeholder box** with label **"Customer scans to earn points"**
- Annotation text: `[Smart loyalty QR — unique per bill, baked with spend + branch]`
- This is the CRM Type 2 (smart loyalty) flow — no manual phone entry required

### Claude's Discretion
- Exact CSS animation style for the camera viewfinder scanning effect
- Exact visual styling of the loyalty card (border, background, icon treatment)
- Whether to use a Solar icon for the camera scan button (e.g. `CameraLinear` or similar)
- QR placeholder visual (solid box, dashed border, or SVG pattern)

</decisions>

<specifics>
## Specific Ideas

- Camera viewfinder sheet should feel like a real scanning experience — not a static mockup. A simple pulsing border or moving scan-line CSS animation makes it believable
- Loyalty section should feel distinct from the payment confirmation — slightly different visual treatment (e.g. subtle gold accent for the tier badge) to separate the "payment done" and "loyalty recorded" moments
- The "Served at HH:MM" display should use Thai locale formatting consistent with the rest of the app (already using `toLocaleString('th-TH')` in ReceiptScreen)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OpenTableModal.tsx`: has guest count input + confirm logic — change default from `1` to `''` (empty string), update validation
- `TableBottomSheet.tsx`: has `markServed()` call at line 166 + `useDwellTimer` — add servedAt display using `table.servedAt` field (already in store)
- `TotalsSection.tsx`: has coupon UI area — replace input block with scan button
- `QrPanel.tsx`: receives `grandTotal` — extend with optional `discountApplied` prop
- `ReceiptScreen.tsx`: loyalty section is a new block to add at the bottom
- `table.store.ts`: `servedAt: number | null` already exists — just needs to be displayed

### Established Patterns
- Bottom sheets: slide-up pattern with backdrop (`translate-y-full → translate-y-0`) already used in `TableBottomSheet.tsx` — reuse for camera viewfinder sheet
- Wireframe annotations: `[annotated]` or `[annotation text]` in `<p className="text-xs text-muted-foreground">` — used throughout payment screen
- `disablePointerDismissal` on dialogs where input is forced (already on OpenTableModal)
- Solar icon set: `CameraLinear` or similar for scan button

### Integration Points
- `OpenTableModal.tsx` → change `useState(1)` to `useState<number | ''>('')`
- `TableBottomSheet.tsx` → read `table.servedAt` to show formatted time after Served
- `TotalsSection.tsx` → replace coupon input JSX with scan button + camera sheet
- `QrPanel.tsx` → add `discountApplied?: number` prop, conditionally render discount note
- `ReceiptScreen.tsx` → add loyalty section JSX block

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-flow-alignment*
*Context gathered: 2026-03-11*
