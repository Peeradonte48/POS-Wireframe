---
name: Design principle
discription: Priciple for project to follow in term of design, accibility, and usability.
---

# Objective

This rule is a design principle for project to follow and implement to design in term of accibility, and usability, This rule is a core principle for project and should be followed in all design decisions.

## 1. Speed & Efficiency (Speed is Paramount)

In high-pressure environments with long queues, staff don't have the luxury of hunting for menus.

- Fewer Clicks: Design the checkout flow to require the absolute minimum number of interactions (Rule of thumb: no more than 3–4 clicks).
- Scanning First: Prioritize barcode scanning as the primary input, backed by a smart, high-speed search system for manual entries.
- Shortcuts: Keep "Top Sellers" or frequently used items as quick-access buttons on the primary dashboard.

## 2.Clarity & Minimalist UI (Reducing Cognitive Load)

The POS interface should display only what is essential for the current task.

- Visual Hierarchy: Use button size and color to signal importance. For instance, the "Pay" or "Checkout" button should be the most prominent element on the screen.
- Color Coding: Implement a color system to categorize products or table statuses (e.g., Green for available, Red for pending payment) to allow for instant visual scanning.
- Status Visibility: Provide real-time clarity on cart contents, total amounts, and change due to reduce mental math for the operator.

## 3.Error Prevention & Recovery (Mitigating Human Error)

Under fatigue, mis-taps are inevitable; the system must act as a safety net.

- Confirmation for Destructive Actions: Deleting items or voiding bills should require a confirmation step or manager-level authorization.
- Easy Undo: Provide a simple way to revert mistakes without freezing or resetting the entire transaction flow.
- Offline Resilience: Ensure the system remains functional during network outages and synchronizes data automatically once connectivity is restored.

## 4. Ergonomics & Hardware Compatibility

Remember that most POS systems are touchscreens operated by staff who are standing.

- Touch Targets: Buttons must be large enough for accurate finger input (minimum $44 \times 44$ points).
- Finger-Friendly UI: Avoid small dropdown menus or excessive text entry fields that slow down the workflow.
- Dark Mode Option: In low-light environments like bars or clubs, high-brightness screens cause eye strain; providing a dark mode is essential for ergonomics.

## 5. Flexibility & Scalability

Every business has unique requirements that the system must accommodate.

- Modular Design: Support modifiers and options (e.g., sweetness levels, extra toppings, split bills) without cluttering the primary interface.
- Multi-Payment Support: Consolidate cash, QR codes, credit cards, and loyalty points into a single, seamless payment screen.

## 6.Glanceable Design & Information Density

The POS interface must communicate information instantaneously, requiring near-zero reading time. This minimizes cognitive load and bridges the gap for non-native speaking staff through visual intuition.

- Match Between System & Real World: Apply the 10 Usability Heuristics by utilizing universal symbols alongside text to ensure the digital interface reflects physical mental models.
- Arm’s Length Legibility: All critical data must be legible from a standing arm’s length distance; the absolute minimum Body Font Size is 16px.
- Universal Iconography: Supplement text with high-recognition icons or product imagery to provide immediate context without linguistic barriers.

## 7.Design for Touch & "Fatigued Finger" Ergonomics

A POS is a high-frequency touch device operated by users standing for extended shifts. Touch Ergonomics, Tap Target Size, and Physical Reachability are not "nice-to-have" features; they are the baseline for a functional UI. A beautiful UI that is physically difficult to use is a failed design.

- Precision Targeting: Adhere to a minimum target size of $44 \times 44$ px (per Apple HIG), with a recommended $54 \times 54$ px for primary Action Buttons to account for high-speed, repetitive use.
- Movement Efficiency (Fitts's Law): Group related interactive elements closely to minimize hand travel distance and reduce physical fatigue.
- Error Zoning: Strategically isolate destructive actions (e.g., Void, Cancel, Delete) away from high-traffic action zones to prevent accidental triggers.

## 8.Contextual Intelligence: Show Only What Is Necessary

Utilize Progressive Disclosure to present only the information relevant to the user’s specific role, context, and current step in the workflow.

- Role-Based UI: Customize the interface permissions and views based on the specific needs of the operator versus the manager.
- Intermittent UI (Drawers): Utilize side drawers or overlays for secondary information to keep the primary canvas clean and focused.
- Empty State Guidance: Design intentional empty states that provide "Next Best Action" cues to guide the user when no data or activity is present.

## Define UI usage

### Modal

- Modal is used for display information that user need to interact with and then close modal to continue work.
- Use when content display less than 50% of screen.

### Bottomsheet

- Bottomsheet is used for display information that user need to interact with and then close bottomsheet to continue work.
- Use when content display more than 50% of screen.

### Drawer

- Drawer is used for display information that user need to interact with and then close drawer to continue work.
- Use when content is need to be seen along side with main content.

### toast

- Toast is used for feedback action when user need to know that action is completed or not.
