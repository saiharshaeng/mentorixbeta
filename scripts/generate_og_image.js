const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function generateOGImage() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const logoPath = path.resolve('src/logo.png');
  const logoBase64 = fs.existsSync(logoPath) 
    ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
    : '';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 1200px;
        height: 630px;
        background: #080914;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 60px 80px;
        position: relative;
        overflow: hidden;
      }
      .glow-purple {
        position: absolute;
        top: -120px;
        right: -100px;
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%);
        border-radius: 50%;
        pointer-events: none;
      }
      .glow-cyan {
        position: absolute;
        bottom: -150px;
        left: -100px;
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0) 70%);
        border-radius: 50%;
        pointer-events: none;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 20px;
        z-index: 2;
      }
      .logo-img {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
      }
      .brand-title {
        font-size: 32px;
        font-weight: 800;
        letter-spacing: 2px;
        background: linear-gradient(135deg, #ffffff 40%, #c4b5fd 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .content {
        z-index: 2;
        max-width: 960px;
      }
      .headline {
        font-size: 56px;
        font-weight: 800;
        line-height: 1.15;
        letter-spacing: -1px;
        margin-bottom: 20px;
        color: #ffffff;
      }
      .headline span {
        background: linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .subtext {
        font-size: 24px;
        color: #94a3b8;
        line-height: 1.5;
        font-weight: 400;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 24px;
        z-index: 2;
      }
      .pill-group {
        display: flex;
        gap: 12px;
      }
      .pill {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 18px;
        border-radius: 999px;
        font-size: 16px;
        color: #e2e8f0;
        font-weight: 500;
      }
      .url {
        font-size: 20px;
        font-weight: 700;
        color: #a78bfa;
        letter-spacing: 0.5px;
      }
    </style>
  </head>
  <body>
    <div class="glow-purple"></div>
    <div class="glow-cyan"></div>
    
    <div class="header">
      ${logoBase64 ? `<img class="logo-img" src="${logoBase64}" />` : ''}
      <div class="brand-title">MENTORIX</div>
    </div>

    <div class="content">
      <div class="headline">Your Personal <span>AI Learning Companion</span></div>
      <div class="subtext">Understand concepts deeply · Practise deliberately · Find your weak spots · Master any topic with structured intelligence.</div>
    </div>

    <div class="footer">
      <div class="pill-group">
        <div class="pill">✨ 100% Free Always</div>
        <div class="pill">⚡ Deliberate Practice</div>
        <div class="pill">🛡️ Zero Ads</div>
      </div>
      <div class="url">mentorixedu.netlify.app</div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html);
  
  const dest1 = 'mentorix-landing-final/landing/public/og-image.png';
  const dest2 = 'src/og-image.png';
  
  await page.screenshot({ path: dest1 });
  await page.screenshot({ path: dest2 });
  console.log(`✓ Generated 1200x630 og-image.png at ${dest1} and ${dest2}`);
  await browser.close();
}

generateOGImage().catch(console.error);
