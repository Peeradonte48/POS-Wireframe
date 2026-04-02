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

  test('setup: open two tables with orders', async ({ page }) => {
    // Step 1: Navigate to table-map
    // TODO: await page.goto('/table-map')

    // Step 2: Open table T3 with 2 guests
    // TODO: await page.getByTestId('table-tile-T3').click()
    // TODO: await page.getByLabel('จำนวนลูกค้า').fill('2')
    // TODO: await page.getByRole('button', { name: 'เปิดโต๊ะ' }).click()

    // Step 3: Navigate to order for T3 and add items
    // TODO: await page.goto('/order/T3')
    // TODO: await page.getByText('Tonkotsu Ramen').click()
    // TODO: await page.getByRole('button', { name: 'Tonkotsu' }).click()
    // TODO: await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 4: Navigate back and open table T4 with 3 guests
    // TODO: await page.goto('/table-map')
    // TODO: await page.getByTestId('table-tile-T4').click()
    // TODO: await page.getByLabel('จำนวนลูกค้า').fill('3')
    // TODO: await page.getByRole('button', { name: 'เปิดโต๊ะ' }).click()

    // Step 5: Navigate to order for T4 and add items
    // TODO: await page.goto('/order/T4')
    // TODO: await page.getByText('Shoyu Ramen').click()
    // TODO: await page.getByRole('button', { name: 'Shoyu' }).click()
    // TODO: await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()
    // TODO: await page.getByText('Miso Ramen').click()
    // TODO: await page.getByRole('button', { name: 'Miso' }).click()
    // TODO: await page.getByRole('button', { name: 'เพิ่มรายการ' }).click()

    // Step 6: Navigate to payment for T3
    // TODO: await page.goto('/payment/T3')
    // TODO: await expect(page).toHaveURL('/payment/T3')

    // Step 7: Assert only T3 items shown (1 item)
    // TODO: await expect(page.getByTestId('bill-line-item')).toHaveCount(1)
  })

  test('initiate merge from primary table payment', async ({ page }) => {
    // Precondition: on /payment/T3, T3 and T4 both have orders

    // Step 1: Navigate to payment page for T3 (primary table)
    // TODO: await page.goto('/payment/T3')

    // Step 2: Assert "Merge Bill" button is visible and enabled
    // TODO: await expect(page.getByRole('button', { name: 'Merge Bill' })).toBeVisible()
    // TODO: await expect(page.getByRole('button', { name: 'Merge Bill' })).toBeEnabled()

    // Step 3: Click "Merge Bill" to open MergeSheet
    // TODO: await page.getByRole('button', { name: 'Merge Bill' }).click()

    // Step 4: Assert MergeSheet is visible
    // TODO: await expect(page.getByTestId('merge-sheet')).toBeVisible()
    // TODO: // Alternative: await expect(page.getByRole('dialog')).toBeVisible()

    // Step 5: Assert MergeSheet shows title about merging
    // TODO: await expect(page.getByTestId('merge-sheet')).toContainText('Merge')
    // TODO: // Alternative: await expect(page.getByTestId('merge-sheet')).toContainText('รวมบิล')
  })

  test('select secondary table for merge', async ({ page }) => {
    // Precondition: MergeSheet is open on /payment/T3

    // Step 1: Navigate to payment page for T3 and open MergeSheet
    // TODO: await page.goto('/payment/T3')
    // TODO: await page.getByRole('button', { name: 'Merge Bill' }).click()

    // Step 2: Assert T4 appears as a selectable occupied table
    // TODO: await expect(page.getByTestId('merge-sheet').getByText('T4')).toBeVisible()

    // Step 3: Assert T3 (primary) does NOT appear as selectable (can't merge with itself)
    // TODO: await expect(page.getByTestId('merge-sheet').getByTestId('merge-candidate-T3')).not.toBeVisible()

    // Step 4: Select T4 as secondary table
    // TODO: await page.getByTestId('merge-sheet').getByTestId('merge-candidate-T4').click()

    // Step 5: Assert T4 shows selected state
    // TODO: await expect(page.getByTestId('merge-candidate-T4')).toHaveAttribute('data-selected', 'true')

    // Step 6: Confirm the merge
    // TODO: await page.getByRole('button', { name: 'ยืนยัน' }).click()
    // TODO: await expect(page.getByTestId('merge-sheet')).not.toBeVisible()

    // Step 7: Assert bill.store.merges has T4 -> T3 mapping
    // TODO: // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('bill-store') ?? '{}'))
    // TODO: // expect(store.state.merges['T4']).toBe('T3')
  })

  test('verify merged bill shows combined items', async ({ page }) => {
    // Precondition: T4 merged as secondary into T3 (primary)

    // Step 1: Assert payment page updates to show merged bill
    // TODO: await expect(page).toHaveURL('/payment/T3')

    // Step 2: Assert merged bill shows items from BOTH T3 and T4
    // TODO: await expect(page.getByTestId('bill-line-item')).toHaveCount(3)
    // TODO: // T3 has 1 item (Tonkotsu), T4 has 2 items (Shoyu + Miso)

    // Step 3: Assert merged total is sum of both tables
    // TODO: // T3 subtotal + T4 subtotal should equal merged total displayed
    // TODO: await expect(page.getByTestId('totals-grand-total')).toBeVisible()

    // Step 4: Assert T4 tile on table-map shows merged/secondary status
    // TODO: await page.goto('/table-map')
    // TODO: await expect(page.getByTestId('table-tile-T4')).toContainText('Merged')
    // TODO: // Alternative: T4 tile shows purple/indigo merge badge linking to T3

    // Step 5: Assert "Split Bill" button is hidden when merge is active (locked decision)
    // TODO: await page.goto('/payment/T3')
    // TODO: await expect(page.getByRole('button', { name: 'Split Bill' })).not.toBeVisible()

    // Step 6: Assert "Merge Bill" button is disabled (already merged)
    // TODO: await expect(page.getByRole('button', { name: 'Merge Bill' })).toBeDisabled()
  })

  test('pay merged bill and verify both tables close', async ({ page }) => {
    // Precondition: T3 + T4 merged, on /payment/T3

    // Step 1: Navigate to payment page for T3 (primary)
    // TODO: await page.goto('/payment/T3')

    // Step 2: Assert combined bill is visible
    // TODO: await expect(page.getByTestId('bill-line-item')).toHaveCount(3)

    // Step 3: Select payment method for full merged amount
    // TODO: await page.getByRole('button', { name: 'Cash' }).click()

    // Step 4: Confirm payment
    // TODO: await page.getByRole('button', { name: 'ยืนยันชำระเงิน' }).click()

    // Step 5: Assert receipt screen appears
    // TODO: await expect(page.getByTestId('receipt-screen')).toBeVisible()

    // Step 6: Dismiss receipt
    // TODO: await page.getByRole('button', { name: 'กลับหน้าหลัก' }).click()

    // Step 7: Assert redirected to table-map
    // TODO: await expect(page).toHaveURL('/table-map')

    // Step 8: Assert PRIMARY table T3 returns to Open status
    // TODO: await expect(page.getByTestId('table-tile-T3')).toHaveAttribute('data-status', 'Open')

    // Step 9: Assert SECONDARY table T4 also returns to Open status (bug fix 2026-03-13)
    // TODO: await expect(page.getByTestId('table-tile-T4')).toHaveAttribute('data-status', 'Open')
    // TODO: // If T4 stays in CheckRequested, the bug has regressed

    // Step 10: Assert bill.store.merges is cleared (no T4->T3 mapping)
    // TODO: // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('bill-store') ?? '{}'))
    // TODO: // expect(store.state.merges['T4']).toBeUndefined()
  })

})
