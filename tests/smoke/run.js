import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../')
const indexPath = 'file://' + path.join(root, 'index.html').replace(/\\/g,'/')

;(async()=>{
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(indexPath)

  console.log('[SMOKE] Opened', indexPath)

  // TODO: Add selectors specific to your UI to create elements and verify states.
  // Placeholder successful exit:
  await browser.close()
  console.log('[SMOKE] Completed (placeholder)')
})().catch(e=>{ console.error(e); process.exit(1) })
