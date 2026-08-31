import { chromium } from 'playwright';

async function debugPageState() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/studio');
  await page.waitForTimeout(2000);
  
  console.log('Page Title:', await page.title());
  const bodyText = await page.locator('body').innerText();
  console.log('Body Text Snippet:\n', bodyText.slice(0, 500));

  await page.screenshot({ path: 'tests/debug_screen.png' });
  console.log('Saved tests/debug_screen.png');
  await browser.close();
}

debugPageState();
