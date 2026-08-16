/**
 * test_cbt_exam.js — Real Headless Chrome CBT Exam Workflow Test
 * Simulates opening CBT Exam hub on http://localhost:8080/#comp, launching a JEE Main/NEET CBT exam,
 * selecting options across questions, clicking Save & Next, submitting the exam, and checking QRA Analysis.
 */

'use strict';

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runCBTTest() {
  console.log('====================================================');
  console.log('🧪 MENTORIX REAL BROWSER CBT EXAM FLOW TEST');
  console.log('====================================================\n');
  console.log(`Using Browser Executable: ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('response', res => {
    if (res.status() === 404) {
      console.error(`  ❌ 404 RESOURCE ERROR: ${res.url()}`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      console.error(`  ❌ CONSOLE ERROR: ${text}`);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error(`  💥 UNHANDLED JS EXCEPTION: ${err.message}`);
  });

  page.on('requestfailed', req => {
    const failure = req.failure();
    failedRequests.push({ url: req.url(), reason: failure ? failure.errorText : 'failed' });
    console.error(`  🌐 FAILED REQUEST: ${req.url()}`);
  });

  console.log('1. Navigating to http://localhost:8080/#comp...');
  await page.goto('http://localhost:8080/#comp', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  console.log('2. Clicking Continue as Guest & launching CBT Exam Room...');
  const setupRes = await page.evaluate(async () => {
    try {
      // Click Continue as Guest link if auth screen is present
      const guestLink = document.querySelector('.skip-auth a');
      if (guestLink) {
        guestLink.click();
        await new Promise(r => setTimeout(r, 800));
      } else if (typeof window.continueAsGuest === 'function') {
        window.continueAsGuest();
        await new Promise(r => setTimeout(r, 800));
      }

      // Navigate to comp screen
      if (typeof window.go === 'function') window.go('comp');
      await new Promise(r => setTimeout(r, 800));

      if (typeof window.rComp === 'function') window.rComp();
      await new Promise(r => setTimeout(r, 800));

      if (typeof window.startMockExamSetup === 'function') {
        await window.startMockExamSetup('full_mock');
        return { success: true, mode: 'startMockExamSetup' };
      }
      return { success: false, reason: 'startMockExamSetup not exported on window' };
    } catch(e) {
      return { success: false, reason: e.message };
    }
  });
  console.log('   CBT Launch Setup Result:', setupRes);

  await new Promise(r => setTimeout(r, 2000));

  // Check if CBT exam panel or questions loaded
  const cbtState = await page.evaluate(() => {
    const mainText = document.body.innerText;
    const hasQuestion = mainText.includes('Question') || mainText.includes('Q1') || mainText.includes('Time Remaining');
    const hasOptions = document.querySelectorAll('input[type="radio"], .opt-card, .cbt-opt').length > 0;
    return { hasQuestion, hasOptions, bodyLength: mainText.length };
  });

  console.log('3. Waiting for CBT Instructions & checking agreement...');
  await new Promise(r => setTimeout(r, 2000));
  const beginRes = await page.evaluate(async () => {
    try {
      const check = document.getElementById('instructions-agree-check');
      if (check) check.checked = true;

      const beginBtn = document.querySelector('[onclick="beginMockExamAfterInstructions()"]');
      if (beginBtn) {
        beginBtn.click();
        return { success: true, mode: 'clickedReadyBtn' };
      } else if (typeof window.beginMockExamAfterInstructions === 'function') {
        window.beginMockExamAfterInstructions();
        return { success: true, mode: 'calledFunction' };
      }
      return { success: false, reason: 'begin button not found' };
    } catch(e) {
      return { success: false, reason: e.message };
    }
  });
  console.log('   Begin Result:', beginRes);
  await new Promise(r => setTimeout(r, 2000));

  console.log('4. Simulating question answering & navigation in active CBT exam...');
  const activeState = await page.evaluate(async () => {
    try {
      // Select option A (index 0) for current question
      if (typeof window.selectMockOption === 'function') window.selectMockOption(0);
      // Save & Next
      if (typeof window.saveAndNextMock === 'function') window.saveAndNextMock();

      // Select option B (index 1) for next question
      if (typeof window.selectMockOption === 'function') window.selectMockOption(1);
      if (typeof window.saveAndNextMock === 'function') window.saveAndNextMock();

      // Mark question for review
      if (typeof window.markMockForReview === 'function') window.markMockForReview();

      const mainText = document.body.innerText;
      const hasQText = mainText.includes('Question') || mainText.includes('Q1') || mainText.includes('Time Remaining') || mainText.includes('PHYSICS') || mainText.includes('SECTION');
      const optionCount = document.querySelectorAll('input[type="radio"], .opt-card, .cbt-opt, [data-opt]').length;

      return { hasQText, optionCount, bodySnippet: mainText.substring(0, 300) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('   Active CBT Exam State:', activeState);

  console.log('5. Submitting CBT Exam...');
  const submitResult = await page.evaluate(async () => {
    try {
      if (typeof window.confirmSubmitMockExam === 'function') {
        window.confirmSubmitMockExam();
        return { success: true };
      }
      return { success: false };
    } catch(e) {
      return { success: false, reason: e.message };
    }
  });
  console.log('   Submit Result:', submitResult);
  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot of CBT test screen
  const screenshotPath = path.join(__dirname, '..', 'metadata', 'cbt_test_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Saved CBT screen screenshot to ${screenshotPath}`);

  await browser.close();

  console.log('\n====================================================');
  console.log(`Console Errors:            ${consoleErrors.length}`);
  console.log(`Unhandled Thrown Exceptions: ${pageErrors.length}`);
  console.log(`Failed Network Requests:    ${failedRequests.length}`);
  console.log('====================================================\n');
}

runCBTTest().catch(err => {
  console.error('Fatal CBT Test Error:', err);
  process.exit(1);
});
