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

  test('setup: open table and add order items', async ({ page }) => {
    // Step 1: Navigate to table-map
    // TODO: await page.goto('/table-map')

    // Step 2: Open table T2 with 2 guests
    // TODO: await page.getByTestId('table-tile-T2').click()
    // TODO: await page.getByLabel('จำนวนลูกค้า').fill('2')
    // TODO: await page.getByRole('button', { name: 'เปิดโต๊ะ' }).click()

    // Step 3: Navigate to order for T2
    // TODO: await page.goto('/order/T2')

    // Step 4: Add at least 2 items (to allow splitting)
    // TODO: await page.getByText('Tonkotsu Ramen').click()
    // TODO: await page.getByRole('button', { name: 'Tonkotsu' }).click()
    // TODO: await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // TODO: await page.getByText('Shoyu Ramen').click()
    // TODO: await page.getByRole('button', { name: 'Shoyu' }).click()
    // TODO: await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 5: Assert item count badge shows 2
    // TODO: await expect(page.getByText('2').first()).toBeVisible()

    // Step 6: Navigate to payment page
    // TODO: await page.getByRole('button', { name: 'เช็คบิล' }).click()
    // TODO: await expect(page).toHaveURL('/payment/T2')

    // Step 7: Assert payment page shows bill items
    // TODO: await expect(page.getByTestId('bill-line-item')).toHaveCount(2)
  })

  test('equal split: divide bill equally among guests', async ({ page }) => {
    // Precondition: on /payment/T2 with 2 items in bill

    // Step 1: Navigate to payment page for T2
    // TODO: await page.goto('/payment/T2')

    // Step 2: Click "Split Bill" button in TotalsSection
    // TODO: await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 3: Assert SplitSheet (mode selector) is visible
    // TODO: await expect(page.getByRole('dialog')).toBeVisible()

    // Step 4: Select "แบ่งจ่าย" (Equal / Value split) mode
    // TODO: await page.getByRole('button', { name: 'แบ่งจ่าย' }).click()

    // Step 5: Assert mode selection advances to ValueSplitSheet
    // TODO: await expect(page.getByTestId('value-split-sheet')).toBeVisible()

    // Step 6: Assert default payer count matches guest count (2)
    // TODO: await expect(page.getByTestId('payer-count')).toContainText('2')

    // Step 7: Assert amounts are pre-filled equally
    // TODO: // Each payer should show 50% of total
    // TODO: await expect(page.getByTestId('payer-amount-0')).not.toBeEmpty()
    // TODO: await expect(page.getByTestId('payer-amount-1')).not.toBeEmpty()

    // Step 8: Confirm the split
    // TODO: await page.getByRole('button', { name: 'ยืนยันการแบ่ง' }).click()
    // TODO: await expect(page.getByTestId('value-split-sheet')).not.toBeVisible()
  })

  test('equal split: pay each portion sequentially', async ({ page }) => {
    // Precondition: value split confirmed for T2 (2 payers)

    // Step 1: Navigate to payment page for T2
    // TODO: await page.goto('/payment/T2')

    // Step 2: Assert split badge is visible on payment page
    // TODO: await expect(page.getByTestId('split-badge')).toBeVisible()

    // Step 3: Open ValueSplitSheet to pay payer 1
    // TODO: await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 4: Select Payer 1 and pay
    // TODO: await page.getByTestId('payer-seat-0').click()
    // TODO: await page.getByRole('button', { name: 'Cash' }).click()
    // TODO: await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // Step 5: Assert Payer 1 shows paid status
    // TODO: await expect(page.getByTestId('payer-seat-0')).toContainText('Paid')

    // Step 6: Pay payer 2
    // TODO: await page.getByTestId('payer-seat-1').click()
    // TODO: await page.getByRole('button', { name: 'Cash' }).click()
    // TODO: await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // Step 7: Assert all portions paid triggers table close flow
    // TODO: await expect(page.getByTestId('receipt-screen')).toBeVisible()
  })

  test('per-seat split: assign items to seats', async ({ page }) => {
    // Precondition: fresh session, T2 open with 2 items (re-setup from Task 1 steps if needed)

    // Step 1: Navigate to payment page for T2
    // TODO: await page.goto('/payment/T2')

    // Step 2: Click "Split Bill" button
    // TODO: await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 3: Select "แยกบิล" (Per-seat / Item split) mode
    // TODO: await page.getByRole('button', { name: 'แยกบิล' }).click()

    // Step 4: Assert ItemSplitSheet appears
    // TODO: await expect(page.getByTestId('item-split-sheet')).toBeVisible()

    // Step 5: Assert all items appear in unassigned column
    // TODO: await expect(page.getByTestId('item-split-sheet').getByTestId('unassigned-item')).toHaveCount(2)

    // Step 6: Assign first item to Seat 1
    // TODO: await page.getByTestId('unassigned-item').first().click()
    // TODO: await page.getByTestId('seat-btn-0').click()

    // Step 7: Assert item moves to Seat 1 column
    // TODO: await expect(page.getByTestId('seat-0-items').getByTestId('assigned-item')).toHaveCount(1)

    // Step 8: Assign second item to Seat 2
    // TODO: await page.getByTestId('unassigned-item').first().click()
    // TODO: await page.getByTestId('seat-btn-1').click()

    // Step 9: Assert all items assigned
    // TODO: await expect(page.getByTestId('unassigned-item')).toHaveCount(0)
    // TODO: await expect(page.getByTestId('seat-1-items').getByTestId('assigned-item')).toHaveCount(1)
  })

  test('per-seat split: pay each seat sequentially', async ({ page }) => {
    // Precondition: per-seat split active for T2, items assigned to 2 seats

    // Step 1: Confirm per-seat split
    // TODO: await page.getByRole('button', { name: 'ยืนยันการแบ่ง' }).click()
    // TODO: await expect(page.getByTestId('item-split-sheet')).not.toBeVisible()

    // Step 2: Open split sheet to pay Seat 1
    // TODO: await page.getByRole('button', { name: 'Split Bill' }).click()

    // Step 3: Assert seat amounts are calculated from assigned items
    // TODO: await expect(page.getByTestId('seat-amount-0')).not.toBeEmpty()

    // Step 4: Pay Seat 1
    // TODO: await page.getByTestId('seat-row-0').getByRole('button', { name: 'Pay' }).click()
    // TODO: await page.getByRole('button', { name: 'QR PromptPay' }).click()
    // TODO: await expect(page.getByTestId('qr-panel')).toBeVisible()
    // TODO: await page.getByRole('button', { name: 'ยืนยันการรับเงิน' }).click()

    // Step 5: Assert Seat 1 shows paid checkmark
    // TODO: await expect(page.getByTestId('seat-row-0')).toContainText('Paid')

    // Step 6: Pay Seat 2
    // TODO: await page.getByTestId('seat-row-1').getByRole('button', { name: 'Pay' }).click()
    // TODO: await page.getByRole('button', { name: 'Cash' }).click()
    // TODO: await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // Step 7: Assert Seat 2 shows paid
    // TODO: await expect(page.getByTestId('seat-row-1')).toContainText('Paid')
  })

  test('table closes after all portions paid', async ({ page }) => {
    // Precondition: all seats/portions paid for T2

    // Step 1: Assert receipt screen appears after last payment
    // TODO: await expect(page.getByTestId('receipt-screen')).toBeVisible()

    // Step 2: Dismiss receipt
    // TODO: await page.getByRole('button', { name: 'กลับหน้าหลัก' }).click()

    // Step 3: Assert redirected to table-map
    // TODO: await expect(page).toHaveURL('/table-map')

    // Step 4: Assert T2 tile returns to Open status
    // TODO: await expect(page.getByTestId('table-tile-T2')).toHaveAttribute('data-status', 'Open')

    // Step 5: Assert bill.store split is cleared (no lingering split state)
    // TODO: // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('bill-store') ?? '{}'))
    // TODO: // expect(store.state.splits['T2']).toBeUndefined()
  })

})
