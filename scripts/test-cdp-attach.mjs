import { chromium } from 'playwright';

async function attachAndInteract() {
  console.log('🔗 Attaching to active Chrome instance on port 9222 via CDP...');

  // Connect directly to the existing Chrome window on the user's screen
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  const page = context.pages()[0] || await context.newPage();

  console.log('📍 Navigating Chrome window to http://localhost:3000/studio ...');
  await page.goto('http://localhost:3000/studio', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('⚙️ Clicking "Settings & Senders" button inside your open Chrome window...');
  const settingsBtn = page.locator('[data-testid="header-settings-btn"]').first();
  await settingsBtn.click();
  await page.waitForTimeout(1500);

  console.log('🔑 Clicking "AI & API Keys" tab...');
  await page.locator('button:has-text("AI & API Keys")').click();
  await page.waitForTimeout(1500);

  console.log('📬 Clicking "SMTP Senders" tab to inspect connected accounts...');
  await page.locator('button:has-text("SMTP Senders")').click();
  await page.waitForTimeout(1500);

  console.log('❌ Closing Settings modal...');
  const closeBtn = page.locator('button:has(svg.lucide-x)').first();
  await closeBtn.click();
  await page.waitForTimeout(1000);

  console.log('✅ Chrome CDP interaction successfully executed directly inside your open desktop Chrome window!');
}

attachAndInteract();
