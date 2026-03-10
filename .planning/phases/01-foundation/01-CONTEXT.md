# Phase 1: Foundation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the Next.js 15 + Tailwind + shadcn/ui project, build the persistent AppShell (header + collapsible sidebar), implement PIN login with role routing, and deliver the Shift Open screen with branch selection and opening cash input — everything that must be true before any POS screen is accessible.

</domain>

<decisions>
## Implementation Decisions

### PIN Login flow
- Role selection comes first (Waiter / Cashier / Manager / Kitchen), then PIN entry
- Large centered numpad grid (3×4), no confirm button needed
- 4-digit PIN, auto-submits on 4th digit entry
- Wrong PIN feedback: screen shake animation + red flash on input, then auto-clear for re-entry

### AppShell layout
- Top header + left collapsible sidebar
- Header displays: Branch Name • Role Badge • Staff Name
- Sidebar nav items: Table Map, Orders, KDS, Payment, Manager — all visible, role-filtered (greyed out if role can't access)
- Sidebar is collapsible: full (icon + label) ↔ compact (icon only)

### Shift Open screen
- Branch selection via dropdown select
- Opening cash: single number input field prefixed with ฿ (Thai Baht)
- Shift Open is a soft gate — AppShell sidebar renders but all sections show a locked state until shift is opened
- After confirming shift: navigate directly to Table Map (no intermediate confirmation screen)

### Role-based UI treatment
- Restricted actions render as greyed out / disabled buttons — visible but not tappable
- Manager PIN override: full overlay modal (dark backdrop, centered card) with the action context shown (e.g., "Authorize: Void Item") above the PIN numpad
- Modal uses the same numpad style as the login screen (consistent pattern)
- Kitchen role: AppShell renders normally, but only KDS nav item is enabled — all others greyed out

### Claude's Discretion
- Exact sidebar width and collapse animation style
- Loading skeleton states during auth
- Specific shadcn/ui component choices (Select, Dialog, Input, etc.)
- Tailwind class spacing and typography scale

</decisions>

<specifics>
## Specific Ideas

- PIN login should feel like a payment terminal — familiar to restaurant staff
- AppShell header context (branch • role • name) should be scannable at a glance without interaction
- The soft gate for shift open should clearly communicate to staff that they need to open a shift — a prompt or locked state indicator near the nav items
- Manager PIN override modal should not require the manager to leave the current screen

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — project is a blank scaffold (only shadcn CLI installed as dev dependency)

### Established Patterns
- Stack: Next.js 15 (App Router) + TypeScript 5 (strict) + Tailwind CSS 4 + shadcn/ui + Zustand 5 + Lucide React
- This phase creates the foundational patterns all subsequent phases will follow

### Integration Points
- Phase 1 establishes the AppShell that every subsequent phase renders inside
- Zustand store for auth state (role, staff name, branch, shift status) must be designed to scale — later phases read from it
- Route structure must support role-gated navigation from Phase 1 onward

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-10*
