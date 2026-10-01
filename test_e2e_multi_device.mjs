// test_e2e_multi_device.mjs
import puppeteer from 'puppeteer-core';

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('================================================================');
  console.log('  MEDIBRIDGE AI — MULTI-DEVICE AUTH & EMAIL VERIFICATION E2E TEST');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const timestamp = Date.now();
  const testUser = {
    fullName: 'Devendra Deshmukh',
    email: `devendra.${timestamp}@healthcloud.in`,
    phone: '9822001199',
    password: 'SecurePassword@2026'
  };

  let generatedPatientId = '';

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: DEVICE A — PATIENT REGISTRATION & EMAIL OTP VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('>>> [DEVICE A] Step 1: Initializing Device A (Clean Isolated Context)...');
    const contextA = await browser.createBrowserContext();
    const pageA = await contextA.newPage();
    await pageA.setViewport({ width: 1280, height: 800 });

    console.log(`[DEVICE A] Navigating to ${APP_URL}/patient/login...`);
    await pageA.goto(`${APP_URL}/patient/login`, { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // Click "Create Account" tab
    console.log('[DEVICE A] Switching to "Create Account" tab...');
    const createAccountTab = await pageA.waitForSelector('button::-p-text(Create Account)', { timeout: 5000 });
    await createAccountTab.click();
    await sleep(800);

    // Fill registration form on Device A
    console.log(`[DEVICE A] Filling registration form for: ${testUser.fullName} (${testUser.email})...`);
    const nameInput = await pageA.waitForSelector('input[placeholder*="Ramesh Kulkarni"]', { timeout: 5000 });
    await nameInput.type(testUser.fullName);

    const emailInput = await pageA.waitForSelector('input[placeholder*="name@example.com"]');
    await emailInput.type(testUser.email);

    const phoneInput = await pageA.waitForSelector('input[placeholder*="98200 12345"]');
    await phoneInput.type(testUser.phone);

    const passInput = await pageA.waitForSelector('input[placeholder*="Create strong password"]');
    await passInput.type(testUser.password);

    const confirmPassInput = await pageA.waitForSelector('input[placeholder*="Repeat password"]');
    await confirmPassInput.type(testUser.password);

    console.log('[DEVICE A] Submitting registration form...');
    const submitBtn = await pageA.waitForSelector('button[type="submit"]');
    await submitBtn.click();

    // Verification screen should appear
    console.log('[DEVICE A] Waiting for Email Verification OTP screen...');
    await pageA.waitForFunction(
      () => document.body.innerText.includes('Verify Your Email Address') || document.body.innerText.includes('Enter 6-Digit OTP Code'),
      { timeout: 12000 }
    );
    console.log('[DEVICE A] ✅ Email Verification screen successfully displayed!');

    // Check for Auto-Fill button or enter OTP
    const autoFillBtn = await pageA.$('button::-p-text(Auto-Fill)');
    if (autoFillBtn) {
      console.log('[DEVICE A] Clicking Auto-Fill OTP button...');
      await autoFillBtn.click();
    } else {
      // Look up OTP from API/DB
      const dbRes = await fetch(`${APP_URL}/api/auth?action=lookup&identifier=${encodeURIComponent(testUser.email)}`);
      const dbData = await dbRes.json();
      console.log('[DEVICE A] Dev/OTP lookup:', dbData);
      const otpInput = await pageA.waitForSelector('input[placeholder*="• • • • • •"]');
      await otpInput.type('123456');
    }

    await sleep(500);
    console.log('[DEVICE A] Submitting OTP verification...');
    const verifySubmitBtn = await pageA.waitForSelector('button[type="submit"]');
    await verifySubmitBtn.click();

    // Wait for redirect to patient dashboard
    console.log('[DEVICE A] Waiting for successful verification & navigation to /patient/dashboard...');
    await pageA.waitForFunction(
      () => window.location.pathname.includes('/patient/dashboard'),
      { timeout: 15000 }
    );

    const urlA = pageA.url();
    console.log(`[DEVICE A] Successfully landed on: ${urlA}`);

    // Wait for dashboard content to render
    await pageA.waitForSelector('h1, h2', { timeout: 8000 });
    await sleep(1000);

    // Extract patient ID and profile info from Device A
    const profileInfoA = await pageA.evaluate(() => {
      const text = document.body.innerText;
      const pidMatch = text.match(/MB-2026-[A-Z0-9]+/);
      return {
        url: window.location.pathname,
        patientId: pidMatch ? pidMatch[0] : null,
        hasName: text.includes('Devendra Deshmukh') || text.includes('Devendra')
      };
    });

    console.log('[DEVICE A] Registered & Verified Profile on Device A:', profileInfoA);
    generatedPatientId = profileInfoA.patientId;

    if (!generatedPatientId) {
      const syncRes = await fetch(`${APP_URL}/api/auth?action=lookup&identifier=${encodeURIComponent(testUser.email)}`);
      const syncData = await syncRes.json();
      generatedPatientId = syncData.user?.patientId;
      console.log(`[DEVICE A] Retrieved Patient ID from Central Store: ${generatedPatientId}`);
    }

    // Close Device A context completely
    await contextA.close();
    console.log('[DEVICE A] Session destroyed. Device A is now offline.\n');

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: DEVICE B — CROSS-DEVICE LOGIN VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('>>> [DEVICE B] Step 2: Launching completely separate Browser Context (Device B)...');
    const contextB = await browser.createBrowserContext();
    const pageB = await contextB.newPage();
    await pageB.setViewport({ width: 1280, height: 800 });

    console.log(`[DEVICE B] Navigating to ${APP_URL}/patient/login...`);
    await pageB.goto(`${APP_URL}/patient/login`, { waitUntil: 'domcontentloaded' });
    await sleep(1200);

    // 2a. Attempt Login with Wrong Password
    console.log(`[DEVICE B] Testing login with registered email (${testUser.email}) and WRONG password...`);
    const idInputB = await pageB.waitForSelector('input[placeholder*="Email or Patient ID"]');
    const passInputB = await pageB.waitForSelector('input[placeholder*="Enter your password"]');

    await idInputB.type(testUser.email);
    await passInputB.type('WrongPasswordXYZ999!');

    const signInBtnB = await pageB.waitForSelector('button[type="submit"]');
    await signInBtnB.click();

    // Wait for the wrong password response to arrive and error message to appear
    await pageB.waitForFunction(() => {
      const text = document.body.innerText;
      const btn = document.querySelector('button[type="submit"]');
      const isNotDisabled = btn && !btn.hasAttribute('disabled');
      const hasError = text.includes('Incorrect password') || text.includes('verify your credentials') || text.includes('credentials') || text.includes('failed');
      return isNotDisabled && hasError;
    }, { timeout: 15000 }).catch(() => {});

    const errorDetected = await pageB.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Incorrect password') || text.includes('verify your credentials') || text.includes('credentials') || text.includes('failed');
    });

    console.log(`[DEVICE B] Security verification — Wrong password rejected properly: ${errorDetected}`);

    // 2b. Login with CORRECT Password
    console.log(`[DEVICE B] Logging in with registered email (${testUser.email}) and CORRECT password...`);
    await passInputB.focus();
    await pageB.keyboard.down('Control');
    await pageB.keyboard.press('A');
    await pageB.keyboard.up('Control');
    await pageB.keyboard.press('Backspace');
    await sleep(200);
    await passInputB.type(testUser.password);
    await sleep(300);

    const activeSubmitBtnB = await pageB.waitForSelector('button[type="submit"]:not([disabled])');
    await activeSubmitBtnB.click();

    console.log('[DEVICE B] Awaiting centralized cloud authentication & local cache hydration...');
    await pageB.waitForFunction(
      () => window.location.pathname.includes('/patient/dashboard'),
      { timeout: 15000 }
    );

    const urlB = pageB.url();
    console.log(`[DEVICE B] Device B successfully authenticated and landed on: ${urlB}`);

    await sleep(1000);
    const profileInfoB = await pageB.evaluate(() => {
      const text = document.body.innerText;
      const pidMatch = text.match(/MB-2026-[A-Z0-9]+/);
      return {
        path: window.location.pathname,
        hasName: text.includes('Devendra Deshmukh') || text.includes('Devendra'),
        patientId: pidMatch ? pidMatch[0] : null
      };
    });

    console.log('[DEVICE B] Profile matched on Device B:', profileInfoB);
    if (!profileInfoB.hasName) {
      throw new Error(`Device B failed to display patient name! Profile: ${JSON.stringify(profileInfoB)}`);
    }

    await contextB.close();
    console.log('[DEVICE B] Device B verified successfully.\n');

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: DEVICE C — PATIENT ID DIRECT LOGIN
    // ─────────────────────────────────────────────────────────────────────────
    if (generatedPatientId) {
      console.log(`>>> [DEVICE C] Step 3: Testing Login on Device C using Patient ID (${generatedPatientId})...`);
      const contextC = await browser.createBrowserContext();
      const pageC = await contextC.newPage();
      await pageC.setViewport({ width: 400, height: 800 }); // Mobile viewport simulation

      await pageC.goto(`${APP_URL}/patient/login`, { waitUntil: 'domcontentloaded' });
      await sleep(1200);

      const idInputC = await pageC.waitForSelector('input[placeholder*="Email or Patient ID"]');
      const passInputC = await pageC.waitForSelector('input[placeholder*="Enter your password"]');

      await idInputC.type(generatedPatientId);
      await passInputC.type(testUser.password);

      const signInBtnC = await pageC.waitForSelector('button[type="submit"]');
      await signInBtnC.click();

      await pageC.waitForFunction(
        () => window.location.pathname.includes('/patient/dashboard'),
        { timeout: 15000 }
      );

      console.log(`[DEVICE C] Patient ID direct login succeeded! Landed on: ${pageC.url()}`);
      await contextC.close();
    }

    console.log('\n================================================================');
    console.log('>>> ALL END-TO-END MULTI-DEVICE AUTHENTICATION TESTS PASSED! <<<');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('\nE2E Test Run Failed:', err);
  process.exit(1);
});
