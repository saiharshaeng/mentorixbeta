const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const root = 'C:/Users/Harsha/.gemini/antigravity-ide/scratch/mentorix/src';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Decode URL to handle spaces and special chars
  const decodedUrl = decodeURIComponent(req.url);
  let filePath = path.join(root, decodedUrl === '/' ? 'index.html' : decodedUrl);
  
  // Normalize paths to check directory traversal
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
        res.statusCode = 404;
        res.end('404 Not Found');
      } else {
        res.statusCode = 500;
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*' // Enable CORS for testing
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
