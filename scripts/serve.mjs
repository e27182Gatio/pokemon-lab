import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/pokemon-lab/')) { res.writeHead(302, { Location: '/pokemon-lab/' }); return res.end(); }
    const relative = decodeURIComponent(url.pathname.slice('/pokemon-lab/'.length)) || 'index.html';
    const file = resolve(root, relative);
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile()) throw new Error('missing');
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173/pokemon-lab/'));
