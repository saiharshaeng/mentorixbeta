const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
// __dirname resolves to the directory this file lives in (src/)
// so we serve the src/ folder itself, regardless of machine or OS
const root = path.join(__dirname);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  // Parse URL to strip query parameters (e.g. ?v=80)
  const parsedUrl = new URL(req.url, 'http://localhost:8080');
  const decodedPathname = decodeURIComponent(parsedUrl.pathname);

  // Favicon fallback handler to prevent Chrome console 404 errors
  if (decodedPathname === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
    return;
  }

  let filePath = path.join(root, decodedPathname === '/' ? 'index.html' : decodedPathname);

  // Normalize paths to prevent directory traversal attacks
  const normalizedRoot = path.normalize(root).toLowerCase();
  const normalizedFilePath = path.normalize(filePath).toLowerCase();

  if (!normalizedFilePath.startsWith(normalizedRoot)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA Fallback: If no file extension (route path like /mentor), serve index.html with 200 OK
        if (!ext) {
          fs.readFile(path.join(root, 'index.html'), (indexErr, indexContent) => {
            if (!indexErr) {
              res.writeHead(200, {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
              });
              res.end(indexContent, 'utf-8');
            } else {
              res.statusCode = 404;
              res.end('404 Not Found');
            }
          });
        } else {
          res.statusCode = 404;
          res.end('404 Not Found');
        }
      } else {
        res.statusCode = 500;
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
