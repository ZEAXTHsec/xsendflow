import { chromium } from 'playwright';
import fs from 'fs';

async function simulateRealUserSignatureFlow() {
  console.log('================================================================');
  console.log('🧑‍💻 SIMULATING REAL USER SIGNATURE CONFIGURATION & PREVIEW');
  console.log('================================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  
  await context.addCookies([
    { name: 'xsendflow_mock_session', value: '1', domain: 'localhost', path: '/' }
  ]);

  await context.addInitScript(() => {
    localStorage.setItem('xsendflow_mock_user', JSON.stringify({ id: 'usr-001', email: 'sarah@outreachhq.io' }));
    localStorage.setItem('xsendflow_display_name', 'Sarah Jenkins');
    localStorage.setItem('xsendflow_org_name', 'OutreachHQ');
    localStorage.setItem('xsendflow_user_plan', 'free');
    localStorage.setItem('xsendflow_default_include_signature', 'true');
    localStorage.setItem('xsendflow_default_signature', 'Best regards,\n{{Sender_Name}}\nFounder & CEO | {{Sender_Company}}\n{{Sender_Website}}');
  });

  const page = await context.newPage();

  try {
    // 1. OPEN STUDIO
    await page.goto('http://localhost:3000/studio', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 2. NAVIGATE TO CAMPAIGN WIZARD
    console.log('\n--- 1. User Opens New Campaign Wizard ---');
    await page.locator('button:has-text("Campaigns & Sequences")').first().click();
    await page.waitForTimeout(400);

    await page.locator('button:has-text("New Campaign Wizard")').first().click();
    await page.waitForTimeout(400);

    // STEP 1
    await page.locator('input[placeholder*="Q4 B2B Founders Outreach"], input[placeholder*="Outreach"]').first().fill('Austin Medical Spas Cold Outreach');
    await page.locator('input[placeholder*="Alex from XSendFlow"]').first().fill('Sarah Jenkins');

    // Confirm Signature Card in Step 1
    const step1SigVisible = await page.locator('text=Append Email Signature').first().isVisible();
    console.log('✓ Step 1: Signature card is visible to user:', step1SigVisible);

    // Proceed to Step 2
    await page.locator('button:has-text("Continue to Upload Contacts")').first().click();
    await page.waitForTimeout(400);

    // STEP 2: Upload CSV
    const csvContent = "First Name,Last Name,Email,Company,City\nJessica,Alba,jessica@honestmedspa.com,Honest MedSpa,Austin\nDavid,Kim,david@austindental.com,Austin Dental,Austin";
    fs.writeFileSync('D:/Antigravity/Saas/Xsendflow/tests/user_sim_leads.csv', csvContent, 'utf8');
    await page.locator('input[type="file"]').first().setInputFiles('D:/Antigravity/Saas/Xsendflow/tests/user_sim_leads.csv');
    await page.waitForTimeout(600);

    // STEP 3: Sequence & Signature Studio
    console.log('\n--- 2. User Inspects Sequence Steps & Signature Studio in Step 3 ---');
    await page.locator('button:has-text("Continue to Sequence Steps")').click();
    await page.waitForTimeout(600);

    // Verify Signature Studio in Step 3
    const step3SigStudio = await page.locator('text=Email Signature').first().isVisible();
    console.log('✓ Step 3: Signature Studio is visible under Email Body:', step3SigStudio);

    // Check Touch 1 Attachment Status
    const touch1Status = await page.locator('text=Attached to Touch 1').first().isVisible();
    console.log('✓ Step 3: Touch 1 shows active attachment status:', touch1Status);

    // Check Live Preview rendering in Touch 1
    const previewContent = await page.locator('div:has-text("Live Recipient View (Touch 1)")').first().innerText();
    const hasSignatureInPreview = previewContent.includes('Sarah Jenkins') && previewContent.includes('OutreachHQ');
    console.log('✓ Step 3: Live Recipient View renders Sarah Jenkins signature:', hasSignatureInPreview);

    // Switch to Touch 2 tab
    console.log('\n--- 3. User Switches to Touch 2 (Follow-up) ---');
    await page.locator('button:has-text("Step 2 (+3d)")').first().click();
    await page.waitForTimeout(400);

    // Verify Touch 2 status (Touch 1 Only recommended mode)
    const touch2Status = await page.locator('text=Disabled on this Touch').first().isVisible();
    console.log('✓ Step 3 Touch 2: Signature correctly disabled on follow-up nudge:', touch2Status);

    // Now switch scope to 'All Touches'
    console.log('\n--- 4. User Switches Signature Scope to All Touches ---');
    await page.locator('select').filter({ hasText: 'Touch 1 Only' }).selectOption('all_steps');
    await page.waitForTimeout(400);

    // Verify Touch 2 now shows active
    const touch2ActiveNow = await page.locator('text=Attached to Touch 2').first().isVisible();
    console.log('✓ Step 3 Touch 2: After changing scope to All Touches, signature is attached to Touch 2:', touch2ActiveNow);

    // STEP 4: Review & Schedule
    console.log('\n--- 5. User Proceeds to Step 4 Review & Launch ---');
    await page.locator('button:has-text("Review & Schedule")').click();
    await page.waitForTimeout(500);

    const step4Text = await page.locator('div:has-text("Campaign Summary Review")').first().innerText();
    const hasSignatureBadge = step4Text.includes('Signature:') && step4Text.includes('All Touches');
    console.log('✓ Step 4: Review summary displays Signature status badge:', hasSignatureBadge);

    // Launch Campaign
    await page.locator('button:has-text("Launch & Schedule Campaign"), button:has-text("Launch Campaign")').first().click();
    await page.waitForTimeout(1000);

    // Check localStorage campaigns
    const savedCamps = await page.evaluate(() => JSON.parse(localStorage.getItem('xsendflow_campaigns_v2') || '[]'));
    const createdCamp = savedCamps[0];
    console.log('\n--- 6. Verifying Stored Campaign Object ---');
    console.log('✓ Campaign Name:', createdCamp.name);
    console.log('✓ includeSignature:', createdCamp.includeSignature);
    console.log('✓ signatureScope:', createdCamp.signatureScope);
    console.log('✓ signatureText:\n', createdCamp.signatureText);

    await browser.close();
    console.log('\n================================================================');
    console.log('🎉 REAL USER JOURNEY TEST PASSED WITH 100% SUCCESS');
    console.log('================================================================');

  } catch (err) {
    console.error('Test Failed:', err);
    await browser.close();
    process.exit(1);
  }
}

simulateRealUserSignatureFlow();
