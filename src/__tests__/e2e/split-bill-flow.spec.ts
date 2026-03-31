/**
 * E2E Stub: Split Bill Flow
 *
 * Covers both split bill paths:
 *   Equal split (custom amounts): open table -> add order -> payment ->
 *     open SplitSheet -> choose equal split -> set amounts -> pay each portion
 *
 *   Per-seat split: assign items to individual seats -> pay each seat sequentially ->
 *     all paid -> table closes
 *
 * Phase 22 — D-04: Playwright stubs with TODO assertions for Phase 25 fill-in.
 * Requirement: AUD-02 (TD-03 in Phase 25 scope)
 *
 * Key routes: /table-map, /order/T2, /payment/T2
 * Key stores: bill.store (splits, payments), table.store (status)
 * Key components: SplitSheet, ValueSplitSheet, ItemSplitSheet
 */

import { test, expect } from '@playwright/test'

test.describe('Split Bill Flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('setup: open table and add order items', async ({ page }) => {
    // Step 1: Navigate to table-map
    await page.goto('/table-map')

    // Step 2: Open table T2 with 2 guests
    await page.getByTestId('table-tile-T2').click()
    await page.getByLabel('จำนวนลูกค้า').fill('2')
    await page.getByRole('button', { name: 'เปิดโต๊ะ' }).click()

    // Step 3: Navigate to order for T2
    await page.goto('/order/T2')

    // Step 4: Add at least 2 items (to allow splitting)
    await page.getByText('Tonkotsu Ramen').click()
    await page.getByRole('button', { name: 'Tonkotsu' }).click()
    await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    await page.getByText('Shoyu Ramen').click()
    await page.getByRole('button', { name: 'Shoyu' }).click()
    await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 5: Assert item count badge shows 2
    await expect(page.getByText('2').first()).toBeVisible()

    // Step 6: Navigate to payment page
    await page.getByRole('button', { name: 'เช็คบิล' }).click()
    await expect(page).toHaveURL('/payment/T2')

    // Step 7: Assert payment page shows bill items
    await expect(page.getByTestId('bill-line-item')).toHaveCount(2)
  })

  test('equal split: divide bill equally among guests', async ({ page }) => {
    // Precondition: on /payment/T2 with 2 items in bill

    // Step 1: Navigate to payment page for T2
    await page.goto('/payment/T2')

    // Step 2: Click "Split Bill" button in TotalsSection
    await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 3: Assert SplitSheet (mode selector) is visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // Step 4: Select "แบ่งจ่าย" (Equal / Value split) mode
    await page.getByRole('button', { name: 'แบ่งจ่าย' }).click()

    // Step 5: Assert mode selection advances to ValueSplitSheet
    await expect(page.getByTestId('value-split-sheet')).toBeVisible()

    // Step 6: Assert default payer count matches guest count (2)
    await expect(page.getByTestId('payer-count')).toContainText('2')

    // Step 7: Assert amounts are pre-filled equally
    // Each payer should show 50% of total
    await expect(page.getByTestId('payer-amount-0')).not.toBeEmpty()
    await expect(page.getByTestId('payer-amount-1')).not.toBeEmpty()

    // Step 8: Confirm the split
    await page.getByRole('button', { name: 'ยืนยันการแบ่ง' }).click()
    await expect(page.getByTestId('value-split-sheet')).not.toBeVisible()
  })

  test('equal split: pay each portion sequentially', async ({ page }) => {
    // Precondition: value split confirmed for T2 (2 payers)

    // Step 1: Navigate to payment page for T2
    await page.goto('/payment/T2')

    // Step 2: Assert split badge is visible on payment page
    await expect(page.getByTestId('split-badge')).toBeVisible()

    // Step 3: Open ValueSplitSheet to pay payer 1
    await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 4: Select Payer 1 and pay
    await page.getByTestId('payer-seat-0').click()
    await page.getByRole('button', { name: 'Cash' }).click()
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // Step 5: Assert Payer 1 shows paid status
    await expect(page.getByTestId('payer-seat-0')).toContainText('Paid')

    // Step 6: Pay payer 2
    await page.getByTestId('payer-seat-1').click()
    await page.getByRole('button', { name: 'Cash' }).click()
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // Step 7: Assert all portions paid triggers table close flow
    await expect(page.getByTestId('receipt-screen')).toBeVisible()
  })

  test('per-seat split: assign items to seats', async ({ page }) => {
    // Precondition: fresh session, T2 open with 2 items (re-setup from Task 1 steps if needed)

    // Step 1: Navigate to payment page for T2
    await page.goto('/payment/T2')

    // Step 2: Click "Split Bill" button
    await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 3: Select "แยกบิล" (Per-seat / Item split) mode
    await page.getByRole('button', { name: 'แยกบิล' }).click()

    // Step 4: Assert ItemSplitSheet appears
    await expect(page.getByTestId('item-split-sheet')).toBeVisible()

    // Step 5: Assert all items appear in unassigned column
    await expect(page.getByTestId('item-split-sheet').getByTestId('unassigned-item')).toHaveCount(2)

    // Step 6: Assign first item to Seat 1
    await page.getByTestId('unassigned-item').first().click()
    await page.getByTestId('seat-btn-0').click()

    // Step 7: Assert item moves to Seat 1 column
    await expect(page.getByTestId('seat-0-items').getByTestId('assigned-item')).toHaveCount(1)

    // Step 8: Assign second item to Seat 2
    await page.getByTestId('unassigned-item').first().click()
    await page.getByTestId('seat-btn-1').click()

    // Step 9: Assert all items assigned
    await expect(page.getByTestId('unassigned-item')).toHaveCount(0)
    await expect(page.getByTestId('seat-1-items').getByTestId('assigned-item')).toHaveCount(1)
  })

  test('per-seat split: pay each seat sequentially', async ({ page }) => {
    // Precondition: per-seat split active for T2, items assigned to 2 seats

    // Step 1: Confirm per-seat split
    await page.getByRole('button', { name: 'ยืนยันการแบ่ง' }).click()
    await expect(page.getByTestId('item-split-sheet')).not.toBeVisible()

    // Step 2: Open split sheet to pay Seat 1
    await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 3: Assert seat amounts are calculated from assigned items
    await expect(page.getByTestId('seat-amount-0')).not.toBeEmpty()

    // Step 4: Pay Seat 1
    await page.getByTestId('seat-row-0').getByRole('button', { name: 'Pay' }).click()
    await page.getByRole('button', { name: 'QR PromptPay' }).click()
    await expect(page.getByTestId('qr-panel')).toBeVisible()
    await page.getByRole('button', { name: 'ยืนยันการรับเงิน' }).click()

    // Step 5: Assert Seat 1 shows paid checkmark
    await expect(page.getByTestId('seat-row-0')).toContainText('Paid')

    // Step 6: Pay Seat 2
    await page.getByTestId('seat-row-1').getByRole('button', { name: 'Pay' }).click()
    await page.getByRole('button', { name: 'Cash' }).click()
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // Step 7: Assert Seat 2 shows paid
    await expect(page.getByTestId('seat-row-1')).toContainText('Paid')
  })

  test('table closes after all portions paid', async ({ page }) => {
    // Precondition: all seats/portions paid for T2

    // Step 1: Assert receipt screen appears after last payment
    await expect(page.getByTestId('receipt-screen')).toBeVisible()

    // Step 2: Dismiss receipt
    await page.getByRole('button', { name: 'กลับหน้าหลัก' }).click()

    // Step 3: Assert redirected to table-map
    await expect(page).toHaveURL('/table-map')

    // Step 4: Assert T2 tile returns to Open status
    await expect(page.getByTestId('table-tile-T2')).toHaveAttribute('data-status', 'Open')

    // Step 5: Assert bill.store split is cleared (no lingering split state)
    // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('bill-store') ?? '{}'))
    // expect(store.state.splits['T2']).toBeUndefined()
  })

})
