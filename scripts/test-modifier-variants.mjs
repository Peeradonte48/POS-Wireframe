import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const OUT = '/tmp/modifier-variants'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 768, height: 1024 },
  storageState: undefined,
})
const page = await ctx.newPage()
page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text())
})

// 1. Login as Waiter — pick role, enter PIN 9999
await page.goto('http://localhost:3000/login')
await page.waitForLoadState('networkidle')
await page.getByRole('button', { name: 'Waiter' }).click()
await page.waitForTimeout(200)
for (const d of '9999') {
  await page.getByRole('button', { name: d, exact: true }).click()
  await page.waitForTimeout(50)
}
await page.waitForURL('**/shift-open', { timeout: 10000 })

// 2. Open Shift — pick branch, click "Open Shift"
await page.locator('#branch-select').click()
await page.waitForTimeout(200)
await page.getByRole('option').first().click()
await page.getByRole('button', { name: 'Open Shift' }).click()
await page.waitForURL('**/table-map', { timeout: 10000 })

// 3. Open T1 — TableTile uses aria-label "โต๊ะ T1, ..."
await page.waitForTimeout(400)
const t1 = page.locator('button[aria-label*="โต๊ะ T1"]').first()
await t1.waitFor({ timeout: 5000 })
const t1Aria = await t1.getAttribute('aria-label')
if (!t1Aria.includes('Occupied')) {
  await t1.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  // Bump guest count once (default 1 → 2)
  await page.getByRole('button', { name: 'Increase guest count' }).click()
  await page.getByRole('button', { name: 'Open Table', exact: true }).click()
  await page.waitForTimeout(500)
}

// 3. Navigate to order page
await page.goto('http://localhost:3000/order/T1')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(500)

// 4. Switch to Hot Ramen category, then open Custom Ramen
const hotTab = page.locator('button[role="tab"]', { hasText: 'ราเมนร้อน' }).first()
await hotTab.click()
await page.waitForTimeout(800)
const customRamen = page.locator('text=Custom Ramen').first()
await customRamen.waitFor({ timeout: 5000 })
await customRamen.scrollIntoViewIfNeeded()
await customRamen.click()
await page.waitForSelector('[role="dialog"][aria-label="Customize order"]', { timeout: 5000 })
await page.waitForTimeout(400)

// 5. Capture each variant
// Scope variant switch to the design-variant radiogroup
const variantGroup = page.getByRole('radiogroup', { name: 'Design variant' })
const sheet = page.locator('[role="dialog"][aria-label="Customize order"]')

for (const variant of ['A', 'B', 'C']) {
  await variantGroup.getByRole('radio', { name: variant, exact: true }).click()
  await page.waitForTimeout(300)
  const file = path.join(OUT, `variant-${variant}-unselected.png`)
  await sheet.screenshot({ path: file })
  console.log(`Saved ${file}`)
}

// Capture variant C with one selection — click the noodle-firmness "ปกติ" option
await variantGroup.getByRole('radio', { name: 'C', exact: true }).click()
await page.waitForTimeout(200)
await sheet.getByRole('radio', { name: /ปกติ/ }).first().click()
await page.waitForTimeout(200)
await sheet.screenshot({ path: path.join(OUT, 'variant-C-selected.png') })
console.log('Saved variant-C-selected.png')

// Capture variant B with the same underlying selection (slider should now show selected)
await variantGroup.getByRole('radio', { name: 'B', exact: true }).click()
await page.waitForTimeout(200)
await sheet.screenshot({ path: path.join(OUT, 'variant-B-selected.png') })
console.log('Saved variant-B-selected.png')

await browser.close()
console.log('DONE')
