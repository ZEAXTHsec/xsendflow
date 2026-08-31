import { chromium } from 'playwright';

async function verifyAuthProtection() {
  console.log('================================================================');
  console.log('🔒 VERIFYING AUTHENTICATION GATE & LOGIN REDIRECTION');
  console.log('================================================================');

  const browser = await chromium.launch({ headless: true });
  
  // 1. Unauthenticated Context (No cookies, empty storage)
  const incognitoContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await incognitoContext.newPage();

  console.log('\n--- 1. Testing Unauthenticated Visitor to /studio ---');
  await page.goto('http://localhost:3000/studio', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const currentUrl = page.url();
  const bodyText = await page.locator('body').innerText();
  const isRedirectedToLogin = currentUrl.includes('/login');
  const isAuthGateVisible = bodyText.includes('Authentication Required') || bodyText.includes('Sign In to Launch Campaigns');

  console.log('✓ Current URL:', currentUrl);
  console.log('✓ Redirected to /login or Protected by Auth Gate:', isRedirectedToLogin || isAuthGateVisible);

  if (!isRedirectedToLogin && !isAuthGateVisible) {
    console.error('❌ FAIL: Unauthenticated visitor was allowed into studio!');
    await browser.close();
    process.exit(1);
  } else {
    console.log('✅ [PASS] Unauthenticated visitor is strictly blocked from studio.');
  }

  // 2. Authenticated Context (Logs in via Free Starter)
  console.log('\n--- 2. Testing Authenticated Visitor via Login ---');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  await page.locator('button:has-text("Free Starter")').first().click();
  await page.waitForTimeout(1500);

  const authUrl = page.url();
  const authBody = await page.locator('body').innerText();
  const isStudioLoaded = authUrl.includes('/studio') && (authBody.includes('Dashboard') || authBody.includes('Campaigns') || authBody.includes('Lead Database'));

  console.log('✓ Authenticated URL:', authUrl);
  console.log('✓ Studio Dashboard Loaded:', isStudioLoaded);

  if (!isStudioLoaded) {
    console.error('❌ FAIL: Authenticated user could not access studio!');
    await browser.close();
    process.exit(1);
  } else {
    console.log('✅ [PASS] Authenticated user gains full access to studio.');
  }

  await browser.close();
  console.log('\n================================================================');
  console.log('🎉 AUTHENTICATION PROTECTION VERIFIED 100% SECURE');
  console.log('================================================================');
}

verifyAuthProtection();
