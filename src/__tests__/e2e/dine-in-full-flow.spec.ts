/**
 * E2E Stub: Dine-in Full Flow
 *
 * Covers the complete dine-in lifecycle:
 *   Login as Waiter -> open table -> add order with ramen modifiers ->
 *   send to kitchen -> KDS bump (New -> InProgress -> Ready) ->
 *   confirm payment -> table returns to Open
 *
 * Phase 22 — D-04: Playwright stubs with TODO assertions for Phase 25 fill-in.
 * Requirement: AUD-02 (TD-03 in Phase 25 scope)
 */

import { test, expect } from '@playwright/test'

// Base URL assumed to be http://localhost:3000 (configure in playwright.config.ts)

test.describe('Dine-in Full Flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('login as Waiter and open shift', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/login')

    // Step 2: Select Waiter role
    await page.getByRole('button', { name: 'Waiter' }).click()

    // Step 3: Enter staff name
    await page.getByPlaceholder('ชื่อพนักงาน').fill('Test Staff')

    // Step 4: Enter branch name
    await page.getByPlaceholder('สาขา').fill('A Ramen Ekkamai')

    // Step 5: Enter opening cash and submit shift open
    await page.getByRole('button', { name: 'เริ่มกะ' }).click()

    // Step 6: Assert redirected to table-map
    await expect(page).toHaveURL('/table-map')

    // Step 7: Assert header shows shift info
    await expect(page.getByText('A Ramen Ekkamai')).toBeVisible()
  })

  test('open table T1 with guest count', async ({ page }) => {
    // Precondition: authenticated as Waiter, on /table-map

    // Step 1: Navigate to table-map
    await page.goto('/table-map')

    // Step 2: Confirm Dine-in tab is active
    await expect(page.getByRole('tab', { name: 'Dine-in' })).toHaveAttribute('data-state', 'active')

    // Step 3: Click an Open table tile (e.g. T1)
    await page.getByTestId('table-tile-T1').click()
    // Alternative: await page.getByText('T1').first().click()

    // Step 4: OpenTableModal appears — assert visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // Step 5: Enter guest count (e.g. 2)
    await page.getByLabel('จำนวนลูกค้า').fill('2')
    // Alternative: await page.getByRole('spinbutton').fill('2')

    // Step 6: Confirm open table
    await page.getByRole('button', { name: 'เปิดโต๊ะ' }).click()

    // Step 7: Assert modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Step 8: Assert T1 tile now shows Occupied status
    await expect(page.getByTestId('table-tile-T1')).toHaveAttribute('data-status', 'Occupied')
    // Alternative: await expect(page.getByTestId('table-tile-T1')).toContainText('Occupied')
  })

  test('add order items with ramen modifiers', async ({ page }) => {
    // Precondition: T1 is Occupied, navigate directly to order page

    // Step 1: Navigate to order entry for T1
    await page.goto('/order/T1')

    // Step 2: Assert header shows table label + guest count
    await expect(page.getByText('T1')).toBeVisible()
    await expect(page.getByText('2 คน')).toBeVisible()

    // Step 3: Select a menu category (e.g. 'ราเมน')
    await page.getByRole('tab', { name: 'ราเมน' }).click()

    // Step 4: Tap a ramen item to open ModifierSheet
    await page.getByTestId('menu-item-ramen-001').click()
    // Alternative: await page.getByText('Tonkotsu Ramen').click()

    // Step 5: Assert ModifierSheet is visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // Step 6: Select broth modifier
    await page.getByRole('button', { name: 'Tonkotsu' }).click()

    // Step 7: Select noodle texture
    await page.getByRole('button', { name: 'Normal' }).click()

    // Step 8: Select spice level (e.g. 2 flames)
    await page.getByTestId('spice-level-2').click()

    // Step 9: Confirm modifier selection
    await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 10: Assert item count badge shows 1
    await expect(page.getByText('1').first()).toBeVisible()
  })

  test('send order to kitchen', async ({ page }) => {
    // Precondition: items added to order for T1

    // Step 1: Navigate to order page for T1
    await page.goto('/order/T1')

    // Step 2: Open ticket panel
    await page.getByRole('button', { name: 'อาหารที่สั่ง' }).click()

    // Step 3: Assert TicketPanel shows added items
    await expect(page.getByTestId('ticket-panel')).toBeVisible()
    await expect(page.getByTestId('ticket-panel').getByText('Tonkotsu Ramen')).toBeVisible()

    // Step 4: Tap "ส่งครัว" (Send to Kitchen) button
    await page.getByRole('button', { name: 'ส่งครัว' }).click()

    // Step 5: Assert success toast appears
    await expect(page.getByText('ส่งออเดอร์แล้ว')).toBeVisible()

    // Step 6: Assert ticket items show "sent" status
    await expect(page.getByTestId('ticket-item-sent')).toBeVisible()
  })

  test('KDS bump ticket through stages', async ({ page }) => {
    // Precondition: order sent, KDS accessible as Kitchen or Manager role

    // Step 1: Navigate to KDS page
    await page.goto('/kds')

    // Step 2: Assert KDS board is visible
    await expect(page.getByTestId('kds-board')).toBeVisible()

    // Step 3: Find the T1 ticket in New column
    await expect(page.getByTestId('kds-ticket-T1')).toBeVisible()
    await expect(page.getByTestId('kds-ticket-T1')).toContainText('New')

    // Step 4: Click BUMP to advance to InProgress
    await page.getByTestId('kds-ticket-T1').getByRole('button', { name: /bump/i }).click()

    // Step 5: Assert ticket moves to InProgress column
    await expect(page.getByTestId('kds-ticket-T1')).toContainText('InProgress')

    // Step 6: Check all items as cooked (required before final BUMP)
    await page.getByTestId('kds-ticket-T1').getByRole('checkbox').first().check()

    // Step 7: BUMP again to advance to Ready
    await page.getByTestId('kds-ticket-T1').getByRole('button', { name: /bump/i }).click()

    // Step 8: Assert ticket moves to Ready column
    await expect(page.getByTestId('kds-ticket-T1')).toContainText('Ready')

    // Step 9: Navigate back to table-map and assert T1 shows Ready badge
    await page.goto('/table-map')
    await expect(page.getByTestId('table-tile-T1')).toContainText('Ready')
  })

  test('confirm payment and close table', async ({ page }) => {
    // Precondition: T1 in Ready/CheckRequested state, navigate to payment

    // Step 1: Navigate to payment page for T1
    await page.goto('/payment/T1')

    // Step 2: Assert bill is visible with correct items
    await expect(page.getByTestId('bill-line-item')).toBeVisible()

    // Step 3: Assert totals section shows subtotal + VAT
    await expect(page.getByText('ยอดรวม')).toBeVisible()
    await expect(page.getByText('VAT')).toBeVisible()

    // Step 4: Select payment method (e.g. Cash)
    await page.getByRole('button', { name: 'Cash' }).click()

    // Step 5: Confirm payment
    await page.getByRole('button', { name: 'ยืนยันชำระเงิน' }).click()

    // Step 6: Assert receipt screen appears
    await expect(page.getByTestId('receipt-screen')).toBeVisible()

    // Step 7: Dismiss receipt and navigate back to table-map
    await page.getByRole('button', { name: 'กลับหน้าหลัก' }).click()

    // Step 8: Assert T1 tile returns to Open status
    await expect(page).toHaveURL('/table-map')
    await expect(page.getByTestId('table-tile-T1')).toHaveAttribute('data-status', 'Open')
  })

})
