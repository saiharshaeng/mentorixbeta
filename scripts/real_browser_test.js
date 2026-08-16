/**
 * real_browser_test.js — Real Headless Browser Automation Test
 * Drives Google Chrome / Microsoft Edge to open http://localhost:8080,
 * captures all console errors, page errors, failed network requests, and DOM rendering status.
 */

'use strict';

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runRealBrowserTest() {
  console.log('====================================================');
  console.log('🌐 MENTORIX REAL BROWSER DIAGNOSTIC TEST');
  console.log('====================================================\n');
  console.log(`Using Browser Executable: ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`  ❌ BROWSER CONSOLE ERROR: ${text}`);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error(`  💥 UNHANDLED JS EXCEPTION: ${err.message}`);
  });

  page.on('requestfailed', req => {
    const failure = req.failure();
    failedRequests.push({ url: req.url(), reason: failure ? failure.errorText : 'failed' });
    console.error(`  🌐 FAILED NETWORK REQUEST: ${req.url()} (${failure ? failure.errorText : 'failed'})`);
  });

  console.log('\nNavigating to http://localhost:8080...');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 30000 });

  // Give page time to initialize
  await new Promise(r => setTimeout(r, 2000));

  const title = await page.title();
  console.log(`✓ Page Loaded Successfully! Title: "${title}"`);

  // Check if splash screen is present
  const splashPresent = await page.evaluate(() => {
    const s = document.getElementById('mx-splash-screen') || document.querySelector('.mx-splash');
    return !!s;
  });
  console.log(`  - Splash Screen Element Present: ${splashPresent}`);

  // Click Continue as Guest link on the profile selector screen
  try {
    await page.waitForSelector('.skip-auth a', { timeout: 3000 });
    await page.click('.skip-auth a');
    await new Promise(r => setTimeout(r, 1000));
    console.log('✓ Clicked "Continue as Guest" successfully!');
  } catch (e) {
    console.warn('⚠️ Guest button click skipped or session already active');
  }

  // Test screen transitions
  const screensToTest = ['dash', 'courses', 'comp', 'revision', 'doubt', 'settings'];
  console.log('\nTesting UI Screen Navigation across all routes...');

  for (const scr of screensToTest) {
    try {
      await page.evaluate(s => {
        if (typeof window.go === 'function') window.go(s);
      }, scr);
      await new Promise(r => setTimeout(r, 500));

      const activeScr = await page.evaluate(() => document.body.getAttribute('data-screen'));
      console.log(`  ✓ Route #${scr} ➔ Active Screen Attribute: "${activeScr}"`);
    } catch (e) {
      console.error(`  ❌ Failed route #${scr}: ${e.message}`);
    }
  }

  // Take screenshot for visual inspection
  const screenshotPath = path.join(__dirname, '..', 'metadata', 'browser_launch_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`\n📸 Saved browser screenshot to ${screenshotPath}`);

  await browser.close();

  console.log('\n====================================================');
  console.log(`Total Console Messages:     ${consoleLogs.length}`);
  console.log(`Console Errors (Console.error): ${consoleErrors.length}`);
  console.log(`Unhandled Thrown Exceptions: ${pageErrors.length}`);
  console.log(`Failed Network Requests:    ${failedRequests.length}`);
  console.log('====================================================\n');

  if (consoleErrors.length === 0 && pageErrors.length === 0 && failedRequests.length === 0) {
    console.log('🏆 REAL BROWSER DIAGNOSTIC TEST PASSED PERFECTLY WITH ZERO ERRORS!');
  } else {
    console.error('⚠️ REAL BROWSER DIAGNOSTIC TEST DETECTED ISSUES ABOVE!');
  }
}

runRealBrowserTest().catch(err => {
  console.error('Fatal Browser Test Error:', err);
  process.exit(1);
});
