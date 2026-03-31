/**
 * E2E Stub: Delivery Queue Flow
 *
 * Covers delivery order lifecycle:
 *   Login -> table-map (Delivery tab) -> delivery order appears (simulated) ->
 *   accept order (Pending -> Confirmed) -> order appears on KDS ->
 *   KDS bump (New -> InProgress -> Ready) -> mark picked up -> PickedUp
 *
 * Phase 22 — D-04: Playwright stubs with TODO assertions for Phase 25 fill-in.
 * Requirement: AUD-02 (TD-03 in Phase 25 scope)
 *
 * Key routes: /table-map?tab=delivery, /kds
 * Key stores: queue.store (channel='delivery'), kds.store
 * Known tech debt: DLVR-04/05 — KDS New->InProgress does not mirror to queue Confirmed->Preparing
 *   (Phase 25 will fix the sync; stub should assert BOTH the KDS state and queue state)
 */

import { test, expect } from '@playwright/test'

test.describe('Delivery Queue Flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('delivery order appears in queue', async ({ page }) => {
    // Step 1: Navigate to table-map
    await page.goto('/table-map')

    // Step 2: Click Delivery tab
    await page.getByRole('tab', { name: 'Delivery' }).click()

    // Step 3: Assert DeliveryPanel is visible
    await expect(page.getByTestId('delivery-panel')).toBeVisible()

    // Step 4: Trigger simulated delivery order (via "Simulate Order" or demo button)
    await page.getByRole('button', { name: 'Simulate Order' }).click()
    // Alternative: delivery order injected automatically when demo mode is active

    // Step 5: Assert a new delivery card appears in the panel
    await expect(page.getByTestId('delivery-card').first()).toBeVisible()

    // Step 6: Assert delivery card shows platform (Grab or LINE MAN)
    await expect(page.getByTestId('delivery-card').first()).toContainText(/Grab|LINE MAN/)

    // Step 7: Assert countdown timer is visible on the card
    await expect(page.getByTestId('delivery-card').first().getByTestId('countdown-ring')).toBeVisible()

    // Step 8: Assert Delivery tab badge shows active count
    await expect(page.getByRole('tab', { name: 'Delivery' }).getByText('1')).toBeVisible()
  })

  test('accept delivery order', async ({ page }) => {
    // Precondition: at least one delivery order in Pending/new state

    // Step 1: Navigate to table-map Delivery tab
    await page.goto('/table-map')
    await page.getByRole('tab', { name: 'Delivery' }).click()

    // Step 2: Find the pending delivery card
    await expect(page.getByTestId('delivery-card').first()).toBeVisible()

    // Step 3: Click Accept button on the card
    await page.getByTestId('delivery-card').first().getByRole('button', { name: 'Accept' }).click()
    // Alternative button text: 'รับออเดอร์'

    // Step 4: Assert order status changes to Confirmed
    await expect(page.getByTestId('delivery-card').first()).toContainText('Confirmed')

    // Step 5: Assert KDS ticket appears for this delivery order
    await page.goto('/kds')
    await expect(page.getByTestId('kds-board')).toBeVisible()
    await expect(page.getByText(/GR-\d+|LM-\d+|DL-/).first()).toBeVisible()

    // Step 6: Assert KDS ticket shows GRAB or LINE MAN badge
    await expect(page.getByTestId('kds-ticket').first()).toContainText(/GRAB|LINE MAN/)
  })

  test('KDS processes delivery ticket', async ({ page }) => {
    // Precondition: delivery order accepted, KDS ticket in New state

    // Step 1: Navigate to KDS
    await page.goto('/kds')

    // Step 2: Assert delivery ticket is in New column
    await expect(page.getByTestId('kds-ticket').first()).toBeVisible()

    // Step 3: BUMP ticket to InProgress
    await page.getByTestId('kds-ticket').first().getByRole('button', { name: /bump/i }).click()

    // Step 4: Assert ticket moves to InProgress column
    await expect(page.getByTestId('kds-ticket').first()).toContainText('InProgress')

    // Step 5: [DLVR-04 known issue] Assert queue.store status updates to Preparing
    // This assertion will FAIL until DLVR-04 is fixed in Phase 25:
    // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('queue-store') ?? '{}'))
    // const deliveryOrder = Object.values(store.state.orders).find(o => o.channel === 'delivery')
    // expect(deliveryOrder?.status).toBe('Preparing')

    // Step 6: Check all items in ticket
    await page.getByTestId('kds-ticket').first().getByRole('checkbox').first().check()

    // Step 7: BUMP ticket to Ready
    await page.getByTestId('kds-ticket').first().getByRole('button', { name: /bump/i }).click()

    // Step 8: Assert ticket moves to Ready column
    await expect(page.getByTestId('kds-ticket').first()).toContainText('Ready')

    // Step 9: [DLVR-05 known issue] Assert queue.store status updates to ReadyForRider
    // This should work (InProgress->Ready bump writes back); verify:
    // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('queue-store') ?? '{}'))
    // const deliveryOrder = Object.values(store.state.orders).find(o => o.channel === 'delivery')
    // expect(deliveryOrder?.status).toBe('ReadyForRider')
  })

  test('mark delivery as picked up', async ({ page }) => {
    // Precondition: delivery order in ReadyForRider state

    // Step 1: Navigate to table-map Delivery tab
    await page.goto('/table-map')
    await page.getByRole('tab', { name: 'Delivery' }).click()

    // Step 2: Find the ReadyForRider delivery card
    await expect(page.getByTestId('delivery-card').first()).toContainText('ReadyForRider')

    // Step 3: Click "Picked Up" or advance status button
    await page.getByTestId('delivery-card').first().getByRole('button', { name: 'Picked Up' }).click()
    // Alternative: Mark as collected / ไรเดอร์รับแล้ว

    // Step 4: Assert order status changes to PickedUp
    await expect(page.getByTestId('delivery-card').first()).toContainText('PickedUp')

    // Step 5: Assert Delivery tab badge count decreases
    await expect(page.getByRole('tab', { name: 'Delivery' }).getByText('1')).not.toBeVisible()

    // Step 6: Verify queue.store reflects PickedUp status
    // const store = await page.evaluate(() => JSON.parse(localStorage.getItem('queue-store') ?? '{}'))
    // const deliveryOrder = Object.values(store.state.orders).find(o => o.channel === 'delivery')
    // expect(deliveryOrder?.status).toBe('PickedUp')
  })

})
