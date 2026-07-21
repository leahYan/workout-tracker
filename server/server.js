// Workout tracker sync server — single file, no dependencies. Node 18+.
// Stores end-to-end-encrypted blobs; this server can never read workout data.
//
//   PORT=8790 DATA_DIR=./data node server.js
//
// API:
//   GET  /v1/blob/:id   -> 200 ciphertext | 404
//   PUT  /v1/blob/:id   -> 200 ok
// :id is a client-derived SHA-256 hex (64 chars). Every request carries
// X-Sync-Auth (a second client-derived secret); the first PUT for an id
// registers its auth hash, and later requests must present the same secret.

'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 8790);
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const MAX_BYTES = 2 * 1024 * 1024;

fs.mkdirSync(DATA, { recursive: true });

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Auth');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const m = req.url.match(/^\/v1\/blob\/([a-f0-9]{64})$/);
  if (!m) { res.writeHead(404); return res.end('not found'); }

  const id = m[1];
  const blobFile = path.join(DATA, id + '.blob');
  const authFile = path.join(DATA, id + '.auth');

  const auth = String(req.headers['x-sync-auth'] || '');
  if (!auth || auth.length > 200) { res.writeHead(401); return res.end('missing auth'); }
  const authHash = sha256(auth);
  const stored = fs.existsSync(authFile) ? fs.readFileSync(authFile, 'utf8') : null;
  if (stored && !safeEqual(stored, authHash)) { res.writeHead(403); return res.end('bad auth'); }

  if (req.method === 'GET') {
    if (!fs.existsSync(blobFile)) { res.writeHead(404); return res.end('no data'); }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    fs.createReadStream(blobFile).pipe(res);
  } else if (req.method === 'PUT') {
    const chunks = [];
    let size = 0, aborted = false;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BYTES) { aborted = true; res.writeHead(413); res.end('too large'); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => {
      if (aborted) return;
      if (!stored) fs.writeFileSync(authFile, authHash);
      const tmp = blobFile + '.tmp';
      fs.writeFileSync(tmp, Buffer.concat(chunks));
      fs.renameSync(tmp, blobFile);
      res.writeHead(200); res.end('ok');
    });
  } else {
    res.writeHead(405); res.end('method not allowed');
  }
}).listen(PORT, () => console.log('workout sync server listening on :' + PORT + ', data in ' + DATA));
