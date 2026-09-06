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

async function main() {
  const root = path.resolve(__dirname);
  const servers = [
    { file: path.join(root, 'express-example.js'), url: 'http://localhost:3000/' },
    { file: path.join(root, 'koa-example.js'), url: 'http://localhost:3001/' },
    { file: path.join(root, 'fastify-example.js'), url: 'http://localhost:3002/' }
  ];
  // Add ESM-based examples (elysia, hono). These will be spawned as
  // child processes if they cannot be required as modules.
  servers.push({ file: path.join(root, 'elysia-example.js'), url: 'http://localhost:3004/' });
  servers.push({ file: path.join(root, 'hono-example.js'), url: 'http://localhost:3005/' });

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
    // Try requiring as if the package were installed; fallback to local
    let miki;
    try { miki = require('miki-template'); } catch (e) { miki = require('../..'); }

    // For each framework, test programmatic partial rendering and finder behavior
    const frameworks = ['express', 'koa', 'fastify', 'elysia', 'hono'];
    for (const name of frameworks) {
      const viewsDir = path.resolve(__dirname, '..', 'views');
      try {
        const asyncHtml = await miki.asyncRender('home#card', { user: name + 'Async', title: name + 'Card' }, { views: viewsDir });
        console.log(`${name}: asyncRender(home#card) length=${asyncHtml.length}`);
      } catch (e) { console.error(`${name}: asyncRender failed`, e && e.message ? e.message : e); }

      try {
        const syncHtml = miki.render('home#card', { user: name + 'Sync', title: name + 'Card' }, { views: viewsDir });
        console.log(`${name}: render(home#card) length=${syncHtml.length}`);
      } catch (e) { console.error(`${name}: render failed`, e && e.message ? e.message : e); }

      // Finder tests: simulate multiple view roots including nested app-template dirs
      try {
        const found = miki.findTemplateInViews('home', [viewsDir, path.resolve(__dirname, '..')]);
        console.log(`${name}: finder resolved -> ${found ? found : 'not found'}`);
      } catch (e) { console.error(`${name}: finder error`, e && e.message ? e.message : e); }
    }
  } catch (e) {
    console.error('Engine partial render failed:', e && e.stack ? e.stack : e);
  }

  // Cleanup: attempt graceful shutdown for each started server
  for (let i = 0; i < procs.length; i++) {
    const p = procs[i];
    try {
      if (!p) continue;
      if (typeof p.kill === 'function') {
        p.kill();
        continue;
      }
      if (typeof p.close === 'function') {
        p.close();
        continue;
      }
      // Fastify may return an address string; try to require module and call exported stop/close
      try {
        const mod = require(servers[i].file);
        if (mod) {
          if (typeof mod.stop === 'function') await mod.stop();
          else if (typeof mod.close === 'function') await mod.close();
          else if (mod.app && typeof mod.app.close === 'function') mod.app.close();
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore errors during cleanup
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('smoke-test failed', err && err.stack ? err.stack : err);
    process.exit(1);
  });
}
