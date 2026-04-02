/**
 * E2E Stub: Takeaway Walk-in Flow
 *
 * Covers takeaway order lifecycle:
 *   Login -> table-map (Takeaway tab) -> create new takeaway ->
 *   order entry -> send to kitchen -> payment -> status advances to Collected
 *
 * Phase 22 — D-04: Playwright stubs with TODO assertions for Phase 25 fill-in.
 * Requirement: AUD-02 (TD-03 in Phase 25 scope)
 *
 * Key routes: /table-map?tab=takeaway, /order/TK-001, /payment/TK-001
 * Key store: queue.store (channel='takeaway', statuses: Taking -> Sent -> Ready -> Collected)
 */

import { test, expect } from '@playwright/test'

test.describe('Takeaway Walk-in Flow', () => {

  test('create new takeaway order from queue tab', async ({ page }) => {
    // Step 1: Navigate to table-map
    // TODO: await page.goto('/table-map')

    // Step 2: Click Takeaway tab
    // TODO: await page.getByRole('tab', { name: 'Take-away' }).click()

    // Step 3: Assert TakeawayPanel is visible
    // TODO: await expect(page.getByTestId('takeaway-panel')).toBeVisible()

    // Step 4: Click "รับออเดอร์ใหม่" (New Takeaway) button
    // TODO: await page.getByRole('button', { name: 'รับออเดอร์ใหม่' }).click()

    // Step 5: Assert create takeaway dialog/modal appears
    // TODO: await expect(page.getByRole('dialog')).toBeVisible()

    // Step 6: Enter customer name
    // TODO: await page.getByLabel('ชื่อลูกค้า').fill('Somchai Test')

    // Step 7: Enter customer phone (optional)
    // TODO: await page.getByLabel('เบอร์โทรศัพท์').fill('0812345678')

    // Step 8: Confirm creation
    // TODO: await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // Step 9: Assert new TK-001 card appears in Takeaway tab
    // TODO: await expect(page.getByTestId('takeaway-card-TK-001')).toBeVisible()
    // TODO: await expect(page.getByTestId('takeaway-card-TK-001')).toContainText('Somchai Test')

    // Step 10: Assert order status starts as Taking
    // TODO: await expect(page.getByTestId('takeaway-card-TK-001')).toContainText('Taking')
  })

  test('enter order items for takeaway', async ({ page }) => {
    // Precondition: TK-001 exists with status Taking

    // Step 1: Navigate to order entry for TK-001
    // TODO: await page.goto('/order/TK-001')

    // Step 2: Assert header shows TK-001 and customer name
    // TODO: await expect(page.getByText('TK-001')).toBeVisible()
    // TODO: await expect(page.getByText('Somchai Test')).toBeVisible()

    // Step 3: Select menu category
    // TODO: await page.getByRole('tab', { name: 'ราเมน' }).click()

    // Step 4: Tap a menu item
    // TODO: await page.getByText('Tonkotsu Ramen').click()

    // Step 5: Complete modifier selection (spice level, broth, noodle)
    // TODO: await page.getByRole('button', { name: 'Tonkotsu' }).click()
    // TODO: await page.getByTestId('spice-level-1').click()
    // TODO: await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 6: Assert item count badge shows 1
    // TODO: await expect(page.getByText('1').first()).toBeVisible()

    // Step 7: Assert "เช็คบิล" button is NOT visible for takeaway (takeaway uses Send flow)
    // TODO: await expect(page.getByRole('button', { name: 'เช็คบิล' })).not.toBeVisible()

    // Step 8: Assert edit customer and cancel buttons are visible (Taking status)
    // TODO: await expect(page.getByLabel('Edit customer')).toBeVisible()
    // TODO: await expect(page.getByLabel('Cancel order')).toBeVisible()
  })

  test('complete takeaway payment', async ({ page }) => {
    // Precondition: TK-001 has items added; open TicketPanel and send to kitchen first

    // Step 1: Navigate to order page for TK-001
    // TODO: await page.goto('/order/TK-001')

    // Step 2: Open ticket panel
    // TODO: await page.getByRole('button', { name: 'อาหารที่สั่ง' }).click()

    // Step 3: Send order to kitchen via TicketPanel (navigates to table-map, not payment)
    // TODO: await page.getByRole('button', { name: 'ส่งครัว' }).click()

    // Step 4: Assert redirected back to table-map
    // TODO: await expect(page).toHaveURL('/table-map')

    // Step 5: Assert TK-001 status is now Sent
    // TODO: await page.getByRole('tab', { name: 'Take-away' }).click()
    // TODO: await expect(page.getByTestId('takeaway-card-TK-001')).toContainText('Sent')

    // Step 6: Navigate to payment for TK-001
    // TODO: await page.goto('/payment/TK-001')

    // Step 7: Assert payment page shows takeaway context (no Split/Merge buttons)
    // TODO: await expect(page.getByRole('button', { name: 'Split Bill' })).not.toBeVisible()
    // TODO: await expect(page.getByRole('button', { name: 'Merge Bill' })).not.toBeVisible()

    // Step 8: Select payment method
    // TODO: await page.getByRole('button', { name: 'Cash' }).click()

    // Step 9: Confirm payment
    // TODO: await page.getByRole('button', { name: 'ยืนยันชำระเงิน' }).click()

    // Step 10: Assert redirect to table-map (takeaway skips receipt screen)
    // TODO: await expect(page).toHaveURL('/table-map')
  })

  test('order status advances to collected', async ({ page }) => {
    // Precondition: TK-001 payment confirmed

    // Step 1: Navigate to table-map Takeaway tab
    // TODO: await page.goto('/table-map')
    // TODO: await page.getByRole('tab', { name: 'Take-away' }).click()

    // Step 2: Assert TK-001 shows Collected or is no longer in active list
    // TODO: await expect(page.getByTestId('takeaway-card-TK-001')).toContainText('Collected')
    // TODO: // Alternative: order may be hidden from active list after collection

    // Step 3: Assert active takeaway count badge updates (decreases or disappears)
    // TODO: await expect(page.getByRole('tab', { name: 'Take-away' }).getByText('1')).not.toBeVisible()

    // Step 4: Verify queue.store reflects final state (Collected)
    // TODO: // Assertion via localStorage or page evaluation:
    // TODO: // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('queue-store') ?? '{}'))
    // TODO: // expect(store.state.orders['TK-001']?.status).toBe('Collected')
  })

})
