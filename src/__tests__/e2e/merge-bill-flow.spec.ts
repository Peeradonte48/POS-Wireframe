/**
 * E2E Stub: Merge Bill Flow
 *
 * Covers merge bill lifecycle:
 *   Login -> open two tables (T3, T4) -> add orders to both ->
 *   navigate to /payment/T3 -> open MergeSheet -> select T4 as secondary ->
 *   merged view shows combined items and total ->
 *   pay merged bill -> both T3 and T4 return to Open status
 *
 * Phase 22 — D-04: Playwright stubs with TODO assertions for Phase 25 fill-in.
 * Requirement: AUD-02 (TD-03 in Phase 25 scope)
 *
 * Key routes: /table-map, /order/T3, /order/T4, /payment/T3
 * Key stores: bill.store (merges: Record<secondaryId, primaryId>), table.store
 * Key components: MergeSheet (src/components/table-map/MergeSheet.tsx)
 * Known fix: After paying a merged bill, secondary tables must be marked Cleaning
 *   and dissolveAll() called — bug fixed 2026-03-13 (see STATE.md bug fixes section)
 */

import { test, expect } from '@playwright/test'

test.describe('Merge Bill Flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('setup: open two tables with orders', async ({ page }) => {
    // Step 1: Navigate to table-map
    await page.goto('/table-map')

    // Step 2: Open table T3 with 2 guests
    await page.getByTestId('table-tile-T3').click()
    await page.getByLabel('จำนวนลูกค้า').fill('2')
    await page.getByRole('button', { name: 'เปิดโต๊ะ' }).click()

    // Step 3: Navigate to order for T3 and add items
    await page.goto('/order/T3')
    await page.getByText('Tonkotsu Ramen').click()
    await page.getByRole('button', { name: 'Tonkotsu' }).click()
    await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 4: Navigate back and open table T4 with 3 guests
    await page.goto('/table-map')
    await page.getByTestId('table-tile-T4').click()
    await page.getByLabel('จำนวนลูกค้า').fill('3')
    await page.getByRole('button', { name: 'เปิดโต๊ะ' }).click()

    // Step 5: Navigate to order for T4 and add items
    await page.goto('/order/T4')
    await page.getByText('Shoyu Ramen').click()
    await page.getByRole('button', { name: 'Shoyu' }).click()
    await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()
    await page.getByText('Miso Ramen').click()
    await page.getByRole('button', { name: 'Miso' }).click()
    await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 6: Navigate to payment for T3
    await page.goto('/payment/T3')
    await expect(page).toHaveURL('/payment/T3')

    // Step 7: Assert only T3 items shown (1 item)
    await expect(page.getByTestId('bill-line-item')).toHaveCount(1)
  })

  test('initiate merge from primary table payment', async ({ page }) => {
    // Precondition: on /payment/T3, T3 and T4 both have orders

    // Step 1: Navigate to payment page for T3 (primary table)
    await page.goto('/payment/T3')

    // Step 2: Assert "Merge Bill" button is visible and enabled
    await expect(page.getByRole('button', { name: 'Merge Bill' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Merge Bill' })).toBeEnabled()

    // Step 3: Click "Merge Bill" to open MergeSheet
    await page.getByRole('button', { name: 'Merge Bill' }).click()

    // Step 4: Assert MergeSheet is visible
    await expect(page.getByTestId('merge-sheet')).toBeVisible()
    // Alternative: await expect(page.getByRole('dialog')).toBeVisible()

    // Step 5: Assert MergeSheet shows title about merging
    await expect(page.getByTestId('merge-sheet')).toContainText('Merge')
    // Alternative: await expect(page.getByTestId('merge-sheet')).toContainText('รวมบิล')
  })

  test('select secondary table for merge', async ({ page }) => {
    // Precondition: MergeSheet is open on /payment/T3

    // Step 1: Navigate to payment page for T3 and open MergeSheet
    await page.goto('/payment/T3')
    await page.getByRole('button', { name: 'Merge Bill' }).click()

    // Step 2: Assert T4 appears as a selectable occupied table
    await expect(page.getByTestId('merge-sheet').getByText('T4')).toBeVisible()

    // Step 3: Assert T3 (primary) does NOT appear as selectable (can't merge with itself)
    await expect(page.getByTestId('merge-sheet').getByTestId('merge-candidate-T3')).not.toBeVisible()

    // Step 4: Select T4 as secondary table
    await page.getByTestId('merge-sheet').getByTestId('merge-candidate-T4').click()

    // Step 5: Assert T4 shows selected state
    await expect(page.getByTestId('merge-candidate-T4')).toHaveAttribute('data-selected', 'true')

    // Step 6: Confirm the merge
    await page.getByRole('button', { name: 'ยืนยัน' }).click()
    await expect(page.getByTestId('merge-sheet')).not.toBeVisible()

    // Step 7: Assert bill.store.merges has T4 -> T3 mapping
    // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('bill-store') ?? '{}'))
    // expect(store.state.merges['T4']).toBe('T3')
  })

  test('verify merged bill shows combined items', async ({ page }) => {
    // Precondition: T4 merged as secondary into T3 (primary)

    // Step 1: Assert payment page updates to show merged bill
    await expect(page).toHaveURL('/payment/T3')

    // Step 2: Assert merged bill shows items from BOTH T3 and T4
    await expect(page.getByTestId('bill-line-item')).toHaveCount(3)
    // T3 has 1 item (Tonkotsu), T4 has 2 items (Shoyu + Miso)

    // Step 3: Assert merged total is sum of both tables
    // T3 subtotal + T4 subtotal should equal merged total displayed
    await expect(page.getByTestId('totals-grand-total')).toBeVisible()

    // Step 4: Assert T4 tile on table-map shows merged/secondary status
    await page.goto('/table-map')
    await expect(page.getByTestId('table-tile-T4')).toContainText('Merged')
    // Alternative: T4 tile shows purple/indigo merge badge linking to T3

    // Step 5: Assert "Split Bill" button is hidden when merge is active (locked decision)
    await page.goto('/payment/T3')
    await expect(page.getByRole('button', { name: 'Split Bill' })).not.toBeVisible()

    // Step 6: Assert "Merge Bill" button is disabled (already merged)
    await expect(page.getByRole('button', { name: 'Merge Bill' })).toBeDisabled()
  })

  test('pay merged bill and verify both tables close', async ({ page }) => {
    // Precondition: T3 + T4 merged, on /payment/T3

    // Step 1: Navigate to payment page for T3 (primary)
    await page.goto('/payment/T3')

    // Step 2: Assert combined bill is visible
    await expect(page.getByTestId('bill-line-item')).toHaveCount(3)

    // Step 3: Select payment method for full merged amount
    await page.getByRole('button', { name: 'Cash' }).click()

    // Step 4: Confirm payment
    await page.getByRole('button', { name: 'ยืนยันชำระเงิน' }).click()

    // Step 5: Assert receipt screen appears
    await expect(page.getByTestId('receipt-screen')).toBeVisible()

    // Step 6: Dismiss receipt
    await page.getByRole('button', { name: 'กลับหน้าหลัก' }).click()

    // Step 7: Assert redirected to table-map
    await expect(page).toHaveURL('/table-map')

    // Step 8: Assert PRIMARY table T3 returns to Open status
    await expect(page.getByTestId('table-tile-T3')).toHaveAttribute('data-status', 'Open')

    // Step 9: Assert SECONDARY table T4 also returns to Open status (bug fix 2026-03-13)
    await expect(page.getByTestId('table-tile-T4')).toHaveAttribute('data-status', 'Open')
    // If T4 stays in CheckRequested, the bug has regressed

    // Step 10: Assert bill.store.merges is cleared (no T4->T3 mapping)
    // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('bill-store') ?? '{}'))
    // expect(store.state.merges['T4']).toBeUndefined()
  })

})
