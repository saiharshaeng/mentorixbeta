const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, '..', 'src', 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

const urls = {
  'gsap.min.js': 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  'anime.min.js': 'https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js',
  'katex.min.js': 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
  'auto-render.min.js': 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js',
  'chart.umd.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js',
  'katex.min.css': 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
};

async function download() {
  for (const [filename, url] of Object.entries(urls)) {
    const dest = path.join(libDir, filename);
    console.log(`Downloading ${url} to ${dest}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let text = await res.text();
      
      // If it's katex.min.css, rewrite fonts url to load from cdn so we don't have to download 20+ font files locally
      if (filename === 'katex.min.css') {
        text = text.replace(/url\(fonts\//g, 'url(https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/fonts/');
      }
      
      fs.writeFileSync(dest, text, 'utf8');
      console.log(`Downloaded ${filename} successfully.`);
    } catch (e) {
      console.error(`Failed to download ${filename}:`, e.message);
    }
  }
}

download().catch(console.error);
