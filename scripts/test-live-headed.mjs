import { chromium } from 'playwright';

async function runLiveHeaded() {
  console.log('🖥️ Opening VISIBLE LIVE BROWSER on your PC screen at http://localhost:3000/studio ...');

  // Launch headed browser visible on user's PC display
  const browser = await chromium.launch({
    headless: false,
    slowMo: 600 // Slow down so user can comfortably watch actions happen
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 820 }
  });

  const page = await context.newPage();

  try {
    console.log('📍 Navigating to live web app http://localhost:3000/studio ...');
    await page.goto('http://localhost:3000/studio', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // 1. Open Settings & Senders
    console.log('⚙️ Opening Settings & Senders modal on screen...');
    await page.locator('[data-testid="header-settings-btn"]').click();
    await page.waitForTimeout(2000);

    // 2. View AI Keys Tab
    console.log('🔑 Switching to AI & API Keys tab...');
    await page.locator('button:has-text("AI & API Keys")').click();
    await page.waitForTimeout(1500);

    // 3. View Preferences Tab
    console.log('⚙️ Switching to Preferences tab...');
    await page.locator('button:has-text("Preferences")').click();
    await page.waitForTimeout(1500);

    // 4. Switch back to Senders Tab
    console.log('📬 Switching back to SMTP Senders tab...');
    await page.locator('button:has-text("SMTP Senders")').click();
    await page.waitForTimeout(2000);

    // 5. Close Settings Modal
    console.log('❌ Closing Settings modal...');
    await page.locator('button:has(svg.lucide-x)').first().click();
    await page.waitForTimeout(1000);

    // 6. Open Campaign Wizard
    console.log('🪄 Opening New Campaign Wizard...');
    await page.locator('button:has-text("New Campaign Wizard")').first().click();
    await page.waitForTimeout(1500);

    // 7. Type Campaign Name
    console.log('✍️ Typing Campaign Name and From Name...');
    await page.locator('input[placeholder="e.g. Q4 B2B Founders Outreach"]').fill('Catchall Inboxing Test Alpha');
    await page.waitForTimeout(800);
    await page.locator('input[placeholder="e.g. Alex from XSendFlow"]').fill('Aftab M.');
    await page.waitForTimeout(1000);

    // 8. Inspect Outbound Mailbox selection
    console.log('📋 Inspecting Outbound Mailbox dropdown with all saved accounts...');
    const senderSelect = page.locator('select').first();
    await senderSelect.click();
    await page.waitForTimeout(1500);

    // 9. Go to Step 2: Upload Contacts
    console.log('➡️ Proceeding to Step 2 (Upload Contacts)...');
    await page.locator('button:has-text("Continue to Upload Contacts")').click();
    await page.waitForTimeout(1500);

    // 10. Paste test catchall contacts
    console.log('📝 Pasting test catchall contacts into CSV box...');
    const sampleCsv = `email,first_name,company\naftab@digixflyy.online,Aftab,DigiXFlyy\naftab@poe2lab.com,Aftab,Poe2Lab\naftab@aftabconsults.com,Aftab,AftabConsults`;
    await page.locator('textarea[placeholder*="email,first_name,company"]').fill(sampleCsv);
    await page.waitForTimeout(1000);

    console.log('⚡ Clicking "Parse Pasted CSV"...');
    await page.locator('button:has-text("Parse Pasted CSV")').click();
    await page.waitForTimeout(1500);

    // 11. Go to Step 3: Sequence Steps
    console.log('➡️ Proceeding to Step 3 (Sequence & Spintax)...');
    await page.locator('button:has-text("Continue to Sequence Steps")').click();
    await page.waitForTimeout(1500);

    // 12. Go to Step 4: Review & Live Test
    console.log('➡️ Proceeding to Step 4 (Review & Live Test)...');
    await page.locator('button:has-text("Review & Schedule")').click();
    await page.waitForTimeout(1500);

    // 13. Open Send Test Email Modal
    console.log('🚀 Opening Live Test Email Dispatcher...');
    await page.locator('button:has-text("Send Test Email")').click();
    await page.waitForTimeout(1500);

    // 14. Fill in destination test email
    console.log('✉️ Filling in test destination catchall email: aftab@digixflyy.online ...');
    await page.locator('input[placeholder="you@domain.com"]').fill('aftab@digixflyy.online');
    await page.waitForTimeout(1500);

    console.log('🚀 Dispatching live test email via SMTP...');
    await page.locator('button:has-text("Send Test Now")').click();
    await page.waitForTimeout(3000);

    // 15. Launch & Schedule Campaign
    console.log('🎉 Finalizing Campaign Launch on screen...');
    await page.locator('button:has-text("Launch & Schedule Campaign")').click();
    await page.waitForTimeout(3000);

    console.log('✅ LIVE PC TEST COMPLETED! Keeping visible browser open for 10 seconds for user inspection...');
    await page.waitForTimeout(10000);
  } catch (err) {
    console.error('❌ Error during visible browser test:', err);
  } finally {
    await browser.close();
    console.log('🔒 Closed live visible browser.');
  }
}

runLiveHeaded();
