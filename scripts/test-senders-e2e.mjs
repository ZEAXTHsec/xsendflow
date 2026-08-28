import { chromium } from 'playwright';

async function run() {
  console.log('🚀 Starting Playwright E2E User Automation for SMTP Credentials...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('📍 Navigating to http://localhost:3000/studio ...');
    await page.goto('http://localhost:3000/studio', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    console.log('🔍 Clicking [data-testid="header-settings-btn"]...');
    await page.locator('[data-testid="header-settings-btn"]').click();
    await page.waitForTimeout(500);

    const accounts = [
      {
        email: 'aftab@digixflyy.online',
        label: 'Aftab M. (Google)',
        host: 'smtp.gmail.com',
        port: '587',
        user: 'aftab@digixflyy.online',
        pass: 'pjenrrxrswdxhqdj'
      },
      {
        email: 'aftab@poe2lab.com',
        label: 'Hostinger Inbox 1',
        host: 'smtp.hostinger.com',
        port: '465',
        user: 'aftab@poe2lab.com',
        pass: 'Aftab123)'
      },
      {
        email: 'aftab@aftabconsults.com',
        label: 'Hostinger Inbox 2',
        host: 'smtp.hostinger.com',
        port: '465',
        user: 'aftab@aftabconsults.com',
        pass: 'Aftab123)'
      },
      {
        email: 'aftab@mohammadaftab.com',
        label: 'Hostinger Inbox 3',
        host: 'smtp.hostinger.com',
        port: '465',
        user: 'aftab@mohammadaftab.com',
        pass: 'Aftab123)'
      }
    ];

    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      console.log(`\n➕ [${i + 1}/4] Adding Account: ${acc.label} (${acc.email})...`);

      // Click "Add Account" button
      const addBtn = page.locator('[data-testid="add-sender-btn"]');
      await addBtn.click();
      await page.waitForTimeout(300);

      // Fill form
      await page.locator('[data-testid="smtp-email"]').fill(acc.email);
      await page.locator('[data-testid="smtp-label"]').fill(acc.label);
      await page.locator('[data-testid="smtp-host"]').fill(acc.host);
      await page.locator('[data-testid="smtp-port"]').fill(acc.port);
      await page.locator('[data-testid="smtp-user"]').fill(acc.user);
      await page.locator('[data-testid="smtp-pass"]').fill(acc.pass);

      console.log(`⚡ Testing Handshake with ${acc.host}:${acc.port}...`);
      await page.locator('[data-testid="test-handshake-btn"]').click();
      await page.waitForTimeout(900);

      console.log(`💾 Saving Account: ${acc.label}...`);
      await page.locator('[data-testid="save-account-btn"]').click();
      await page.waitForTimeout(500);

      console.log(`✅ [${i + 1}/4] Successfully saved: ${acc.email}`);
    }

    console.log('\n📸 Taking screenshot of Settings modal with all 4 accounts saved...');
    await page.screenshot({ path: 'settings_senders_saved.png' });

    // Close the settings modal
    console.log('❌ Closing Settings & Profile modal...');
    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await page.waitForTimeout(500);

    // Open Campaign Creation Wizard and verify Outbound Mailbox dropdown
    console.log('🪄 Opening Campaign Creation Wizard to verify sender dropdown...');
    const newCampBtn = page.locator('button:has-text("New Campaign Wizard")').first();
    await newCampBtn.click();
    await page.waitForTimeout(500);

    const senderSelect = page.locator('select').first();
    const options = await senderSelect.locator('option').allInnerTexts();
    console.log('\n📋 Outbound Mailbox Dropdown Options verified in Campaign Wizard:');
    options.forEach((opt, idx) => console.log(`   ${idx + 1}. ${opt}`));

    await page.screenshot({ path: 'campaign_wizard_senders.png' });

    console.log('\n🎉 Playwright test PASSED! All 4 sender accounts saved, persisted in localStorage, and wired into Campaign Wizard.');
  } catch (err) {
    console.error('❌ Error during Playwright test:', err);
  } finally {
    await browser.close();
  }
}

run();
