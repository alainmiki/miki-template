const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

async function start(scriptPath) {
  // Require the example module and call its exported start() which
  // returns a Promise or a server instance.
  const mod = require(scriptPath);
  if (mod && typeof mod.start === 'function') {
    const res = mod.start();
    // Fastify returns a Promise resolving to server address; Koa/Express
    // return a server instance synchronously — normalize both.
    if (res && typeof res.then === 'function') {
      await res;
      return res;
    }
    return res;
  }
  // Fallback: spawn as a child process
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: 'inherit' });
    child.on('error', reject);
    setTimeout(() => resolve(child), 800);
  });
}

async function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', c => data += c.toString());
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  const root = path.resolve(__dirname);
  const servers = [
    { file: path.join(root, 'express-example.js'), url: 'http://localhost:3000/' },
    { file: path.join(root, 'koa-example.js'), url: 'http://localhost:3001/' },
    { file: path.join(root, 'fastify-example.js'), url: 'http://localhost:3002/' }
  ];

  const procs = [];
  for (const s of servers) {
    procs.push(await start(s.file));
  }

  // Test each server
  for (const s of servers) {
    try {
      const res = await fetch(s.url);
      console.log(`${s.url} -> ${res.status} length=${res.body.length}`);
    } catch (e) {
      console.error(`Failed to fetch ${s.url}:`, e.message || e);
    }
  }

  // Test partial route on express
  try {
    const res = await fetch('http://localhost:3000/partial');
    console.log(`/partial -> ${res.status} length=${res.body.length}`);
  } catch (e) { console.error('Partial fetch failed', e.message || e); }

  // Programmatic engine tests: render('home#card') via the engine APIs
  try {
    const miki = require('../..');
    const viewsDir = path.resolve(__dirname, '..', 'views');
    // asyncRender with partial
    const asyncHtml = await miki.asyncRender('home#card', { user: 'EngineAsync', title: 'EngineCard' }, { views: viewsDir });
    console.log('engine asyncRender(home#card) length=' + asyncHtml.length);
    // sync render (no async helpers present in template)
    const syncHtml = miki.render('home#card', { user: 'EngineSync', title: 'EngineCard' }, { views: viewsDir });
    console.log('engine render(home#card) length=' + syncHtml.length);
  } catch (e) {
    console.error('Engine partial render failed:', e && e.stack ? e.stack : e);
  }

  // Cleanup
  for (const p of procs) p.kill();
})();
