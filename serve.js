// Tiny static server for the site, with HTTP Range support (videos need it to loop and seek).
// Run: node serve.js   then open http://localhost:5173
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT) || 5173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(root, path.normalize(urlPath));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const headers = {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    };
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (!range || (range[1] === '' && range[2] === '')) {
      res.writeHead(200, { ...headers, 'Content-Length': stat.size });
      return fs.createReadStream(file).pipe(res);
    }
    let start;
    let end;
    if (range[1] === '') {            // suffix range: the last N bytes
      start = Math.max(0, stat.size - Number(range[2]));
      end = stat.size - 1;
    } else {
      start = Number(range[1]);
      end = range[2] === '' ? stat.size - 1 : Math.min(Number(range[2]), stat.size - 1);
    }
    if (start > end || start >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  });
}).listen(port, () => console.log(`ONE PIECE | Luffy  ->  http://localhost:${port}`));
