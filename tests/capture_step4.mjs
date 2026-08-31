import { chromium } from 'playwright';
import fs from 'fs';

async function captureStep4() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  await context.addCookies([
    { name: 'xsendflow_mock_session', value: '1', domain: 'localhost', path: '/' }
  ]);

  await context.addInitScript(() => {
    localStorage.setItem('xsendflow_mock_user', JSON.stringify({ id: 'usr-free-001', email: 'alex@xsendflow.com' }));
    localStorage.setItem('xsendflow_display_name', 'Alex Turner');
    localStorage.setItem('xsendflow_org_name', 'XSendFlow Inc');
    localStorage.setItem('xsendflow_user_plan', 'free');
    localStorage.setItem('xsendflow_default_include_signature', 'true');
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000/studio', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.locator('button:has-text("Campaigns & Sequences")').first().click();
  await page.waitForTimeout(400);

  await page.locator('button:has-text("New Campaign Wizard")').first().click();
  await page.waitForTimeout(400);

  await page.locator('input[placeholder*="Q4 B2B Founders Outreach"], input[placeholder*="Outreach"]').first().fill('SaaS Founders Teardown Outbound');
  await page.locator('button:has-text("Continue to Upload Contacts")').first().click();
  await page.waitForTimeout(400);

  const csvContent = `First Name,Last Name,Email,Company,City
Elena,Rostova,elena@apexprop.com,Apex Properties,Austin
Marcus,Vance,marcus@vancecap.com,Vance Capital,Dallas`;
  fs.writeFileSync('D:/Antigravity/Saas/Xsendflow/tests/sig_test_leads.csv', csvContent, 'utf8');
  await page.locator('input[type="file"]').first().setInputFiles('D:/Antigravity/Saas/Xsendflow/tests/sig_test_leads.csv');
  await page.waitForTimeout(500);

  await page.locator('button:has-text("Continue to Sequence Steps")').click();
  await page.waitForTimeout(400);

  await page.locator('button:has-text("Review & Schedule")').click();
  await page.waitForTimeout(400);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  await page.screenshot({ path: 'tests/signature_wizard_step4_focused.png', fullPage: true });
  console.log('📸 Saved tests/signature_wizard_step4_focused.png with fullPage: true');

  await browser.close();
}

captureStep4();
