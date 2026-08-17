/**
 * server.js — Mentorix High-Performance Local Dev Server
 * Zero 404 Console Noise Edition
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const root = path.join(__dirname, 'src');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

// 1x1 transparent PNG pixel buffer for missing images
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost:8080');
  const decodedPathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Extension & DevTools Fallbacks (Prevents Chrome extension & map 404 errors)
  if (
    decodedPathname.endsWith('.map') ||
    decodedPathname.includes('.ts-') ||
    decodedPathname.includes('chrome-extension') ||
    decodedPathname.includes('content.ts')
  ) {
    res.writeHead(200, {
      'Content-Type': decodedPathname.endsWith('.map') ? 'application/json' : 'text/javascript',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(decodedPathname.endsWith('.map') ? '{}' : '/* extension stub */');
    return;
  }

  // 2. Favicon fallback
  if (decodedPathname === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  let filePath = path.join(root, decodedPathname === '/' ? 'index.html' : decodedPathname);

  // Security normalization check
  const normalizedRoot = path.normalize(root).toLowerCase();
  const normalizedFilePath = path.normalize(filePath).toLowerCase();

  if (!normalizedFilePath.startsWith(normalizedRoot)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA Fallback: If no file extension (route path like /mentor), serve index.html with 200 OK
        if (!ext || ext === '.html') {
          fs.readFile(path.join(root, 'index.html'), (indexErr, indexContent) => {
            if (!indexErr) {
              res.writeHead(200, {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
              });
              res.end(indexContent, 'utf-8');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<!DOCTYPE html><html><body>Mentorix</body></html>');
            }
          });
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg'].includes(ext)) {
          // Graceful fallback for missing image assets
          res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
          res.end(TRANSPARENT_PNG);
        } else if (['.js', '.json', '.css'].includes(ext)) {
          // For JSON data files (like PYQ papers), return a real 404 so the
          // browser fetch() rejects properly. For JS/CSS stubs, return a stub.
          if (ext === '.json') {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end('{"error":"File not found"}');
          } else {
            res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
            res.end('/* asset stub */');
          }
        } else {
          res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
          res.end('');
        }
      } else {
        res.statusCode = 500;
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Binary files (images, fonts, etc.) must NOT have an encoding argument —
      // passing 'utf-8' to res.end() corrupts binary Buffers by re-encoding them.
      const TEXT_TYPES = ['.html', '.css', '.js', '.json', '.svg', '.map'];
      const isText = TEXT_TYPES.includes(ext);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      });
      if (isText) {
        res.end(content, 'utf-8');
      } else {
        res.end(content); // binary — no encoding
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
