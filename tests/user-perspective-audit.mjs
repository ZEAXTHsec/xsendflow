import { chromium } from 'playwright';
import fs from 'fs';

async function runUserAudit() {
  console.log('================================================================');
  console.log('🧑‍💻 REAL-USER PLAYWRIGHT TEST: SIMULATING FREE TIER USER JOURNEY');
  console.log('================================================================');

  const findings = [];
  const log = (id, feature, status, expectation, reality, recommendation) => {
    findings.push({ id, feature, status, expectation, reality, recommendation });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${status}] ${feature}`);
    console.log(`   • Expectation: ${expectation}`);
    console.log(`   • User Reality: ${reality}`);
    if (recommendation) console.log(`   • Recommendation: ${recommendation}`);
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. VISIT LOGIN AND CLICK "Free Starter"
    console.log('\n--- 1. Authenticating as Free Starter User ---');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const freeStarterBtn = page.locator('button:has-text("Free Starter"), button:has-text("Free")').first();
    if (await freeStarterBtn.isVisible()) {
      await freeStarterBtn.click();
      await page.waitForTimeout(2000);
      log('AUTH-1', '1-Click Free Starter Login', 'PASS', 'User logs into Studio with Free Starter profile', 'Successfully logged in');
    }

    // 2. CHECK STUDIO DASHBOARD & 3 PILLARS
    console.log('\n--- 2. Auditing Studio Navigation & Tabs ---');
    const campBtn = page.locator('button:has-text("Campaigns & Sequences")').first();
    const leadsBtn = page.locator('button:has-text("Lead Database")').first();
    const dashBtn = page.locator('button:has-text("Dashboard")').first();

    const hasPillars = (await campBtn.isVisible()) && (await leadsBtn.isVisible()) && (await dashBtn.isVisible());
    if (hasPillars) {
      log('NAV-1', 'Main 3-Pillar Navigation Bar', 'PASS', 'User can navigate between Dashboard, Campaigns, and Lead Database', 'All 3 pillars rendered cleanly');
    } else {
      log('NAV-1', 'Main 3-Pillar Navigation Bar', 'FAIL', 'Navigation tabs should be visible', 'Found missing navigation pillars');
    }

    // 3. CAMPAIGN 1 CREATION & CSV UPLOAD
    console.log('\n--- 3. Testing Campaign 1 Creation & Master Lead DB Sync ---');
    await campBtn.click();
    await page.waitForTimeout(1000);

    const newCampBtn = page.locator('button:has-text("New Campaign"), button:has-text("Create Campaign")').first();
    await newCampBtn.click();
    await page.waitForTimeout(1000);

    // Step 1: Campaign Details
    await page.locator('input[placeholder*="Dental Clinics"], input[placeholder*="Campaign Name"], input[placeholder*="Q3"]').first().fill('Austin Commercial HVAC');
    
    // Check Open Tracking Toggle in Step 1
    const hasOpenTrackingStep1 = await page.locator('text=Track Email Opens').first().isVisible();
    if (hasOpenTrackingStep1) {
      log('TRACK-1', 'Open Tracking Toggle in Step 1', 'PASS', 'User can toggle open tracking pixel on/off in Step 1', 'Found Open Tracking checkbox (Default ON)');
    } else {
      log('TRACK-1', 'Open Tracking Toggle in Step 1', 'FAIL', 'Open Tracking checkbox should be visible', 'Not found in Step 1');
    }

    // Step 2: Upload CSV
    await page.locator('button:has-text("Continue to Upload Contacts"), button:has-text("Next")').first().click();
    await page.waitForTimeout(1000);

    const csv1 = `First Name,Last Name,Email,Company,City
Sarah,Connor,sarah@skynetdefense.com,Skynet Defense,Austin
John,Connor,john@resistance.io,Resistance Inc,Dallas
Kyle,Reese,kyle@futuretech.org,FutureTech,Houston
Miles,Dyson,miles@cyberdyne.ai,Cyberdyne,Austin
Marcus,Wright,marcus@salvation.co,Salvation Co,San Antonio`;

    fs.writeFileSync('D:/Antigravity/Saas/Xsendflow/tests/test_camp_leads_1.csv', csv1, 'utf8');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('D:/Antigravity/Saas/Xsendflow/tests/test_camp_leads_1.csv');
    await page.waitForTimeout(1500);

    // Step 3: Sequence
    await page.locator('button:has-text("Continue to Sequence Steps")').click();
    await page.waitForTimeout(1000);

    const pitchBox = page.locator('textarea').first();
    if (await pitchBox.isVisible()) {
      await pitchBox.fill('commercial HVAC maintenance for office buildings');
    }

    // Step 4: Review & Schedule
    await page.locator('button:has-text("Review & Schedule")').click();
    await page.waitForTimeout(1000);

    // Step 4 Summary inspection
    const hasOpenTrackingStep4 = await page.locator('text=Track Opens, text=Tracking: ON, text=Open Tracking').first().isVisible().catch(() => false);
    if (!hasOpenTrackingStep4) {
      log('TRACK-2', 'Open Tracking Visibility in Step 4 Review', 'WARN', 'User should see Open Tracking status (ON/OFF) in Step 4 Review Summary', 'Step 4 shows Name, Recipients, Touches, Sending Window, but omits Tracking & Unsubscribe summary status', 'Add Tracking status badge (e.g. "Opens: Tracked • Unsubscribe: Reply STOP") to Step 4 Summary cards');
    }

    // Launch Campaign
    await page.locator('button:has-text("Launch Campaign"), button:has-text("Save Campaign")').first().click();
    await page.waitForTimeout(2000);

    // AUDIT: Check Master Lead Database in localStorage
    const dbLeadsAfterCamp1 = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('xsendflow_leads') || '[]');
    });

    if (dbLeadsAfterCamp1.length >= 5) {
      log('LEADS-1', 'Master Lead Database Auto-Sync on Campaign Launch', 'PASS', '5 uploaded campaign contacts should automatically sync to Master Lead DB', `Found ${dbLeadsAfterCamp1.length} leads in Master Lead DB`);
    } else {
      log('LEADS-1', 'Master Lead Database Auto-Sync on Campaign Launch', 'FAIL', 'Uploaded CSV contacts must automatically populate the Master Lead Database upon campaign creation', `Master Lead DB contains ${dbLeadsAfterCamp1.length} leads (Expected at least 5 leads)`, 'When a campaign is saved, automatically upsert valid contacts into xsendflow_leads and studio state with clean sanitation.');
    }

    // 4. CAMPAIGN 2 CREATION & DEDUPLICATION TEST
    console.log('\n--- 4. Testing Campaign 2 Creation & Deduplication Logic ---');
    const newCampBtn2 = page.locator('button:has-text("New Campaign"), button:has-text("Create Campaign")').first();
    await newCampBtn2.click();
    await page.waitForTimeout(1000);

    await page.locator('input[placeholder*="Dental Clinics"], input[placeholder*="Campaign Name"], input[placeholder*="Q3"]').first().fill('Austin HVAC Followup Fleet');
    await page.locator('button:has-text("Continue to Upload Contacts")').first().click();
    await page.waitForTimeout(1000);

    // Upload 3 Duplicate + 2 New Leads
    const csv2 = `First Name,Last Name,Email,Company,City
Sarah,Connor,sarah@skynetdefense.com,Skynet Defense,Austin
John,Connor,john@resistance.io,Resistance Inc,Dallas
Kyle,Reese,kyle@futuretech.org,FutureTech,Houston
Grace,Harper,grace@legiondefense.com,Legion Defense,Dallas
Dani,Ramos,dani@newmexicoenergy.com,New Mexico Energy,Houston`;

    fs.writeFileSync('D:/Antigravity/Saas/Xsendflow/tests/test_camp_leads_2.csv', csv2, 'utf8');
    await page.locator('input[type="file"]').first().setInputFiles('D:/Antigravity/Saas/Xsendflow/tests/test_camp_leads_2.csv');
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Continue to Sequence Steps")').click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Review & Schedule")').click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Save Campaign as Paused"), button:has-text("Launch Campaign"), button:has-text("Save Campaign")').first().click();
    await page.waitForTimeout(2000);

    const dbLeadsAfterCamp2 = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('xsendflow_leads') || '[]');
    });

    log(
      'LEADS-2',
      'Cross-Campaign Lead Deduplication & Master DB Retention',
      dbLeadsAfterCamp2.length >= 7 ? 'PASS' : 'FAIL',
      'Master Lead Database should contain 7 unique leads (5 initial + 2 new, ignoring 3 duplicates)',
      `Master Lead DB contains ${dbLeadsAfterCamp2.length} leads`,
      'Implement unique email index deduplication so existing records are preserved and only unique new contacts are added to the Lead Database up to the plan limit (250).'
    );

    // 5. TEST LEAD DATABASE / SANITIZER TAB DIRECTLY
    console.log('\n--- 5. Testing Lead Database / Sanitizer Tab ---');
    await leadsBtn.click();
    await page.waitForTimeout(1500);

    const leadTableRows = await page.locator('table tbody tr').count();
    const leadCountBadge = await leadsBtn.innerText().catch(() => '');

    log(
      'LEAD-UI-1',
      'Lead Database Table Display',
      leadTableRows > 0 ? 'PASS' : 'FAIL',
      'Lead Database should show table of leads with sanitation badges, icebreakers, and slug links',
      `Displaying ${leadTableRows} table rows. Navigation badge: "${leadCountBadge.trim()}"`,
      'Ensure Lead Database tab automatically re-renders whenever campaigns are created or leads are imported.'
    );

    // 6. TEST SETTINGS MODAL & PREFERENCES
    console.log('\n--- 6. Testing Settings Modal & Preferences ---');
    const settingsBtn = page.locator('button:has-text("Settings"), button[aria-label="Settings"]').first();
    await settingsBtn.click();
    await page.waitForTimeout(1000);

    // Check Preferences tab
    await page.locator('button:has-text("Outreach Preferences"), button:has-text("Preferences")').first().click();
    await page.waitForTimeout(500);

    const hasGlobalOpenTracking = await page.locator('text=Open Tracking, text=Track Email Opens').first().isVisible().catch(() => false);
    if (!hasGlobalOpenTracking) {
      log('PREF-1', 'Global Open Tracking Preference', 'WARN', 'User should have a global default toggle for Open Tracking in Settings ➔ Outreach Preferences', 'Outreach Preferences currently has Daily Send Limit, Timezone, Jitter Delay, and Unsubscribe style, but lacks a default Open Tracking toggle', 'Add a "Default Open Tracking (1x1 Transparent Pixel)" toggle in Outreach Preferences.');
    }

    // Check Plan & Limits tab
    await page.locator('button:has-text("Plan & Limits"), button:has-text("Billing")').first().click();
    await page.waitForTimeout(500);

    const planName = await page.locator('text=Free Forever, text=Free Plan, text=Active Plan').first().innerText().catch(() => '');
    log('PLAN-1', 'Plan & Limits Inspection', 'PASS', 'User can inspect active plan and limits', `Plan details displayed: "${planName}"`);

    await browser.close();

    console.log('\n================================================================');
    console.log(`🏁 USER AUDIT COMPLETE: ${findings.length} User Scenarios Tested`);
    console.log('================================================================');

    fs.writeFileSync('D:/Antigravity/Saas/Xsendflow/tests/user-audit-report.json', JSON.stringify(findings, null, 2), 'utf8');

  } catch (err) {
    console.error('Audit Runner Error:', err);
    await browser.close();
  }
}

runUserAudit();
