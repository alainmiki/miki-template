import { Hono } from 'hono';
import miki from '../../src/esm.mjs';
import path from 'path';

const app = new Hono();

app.get('/', async (c) => {
  const html = await miki.asyncRender('home', {}, { views: path.resolve('./live-test/views') });
  return c.html(html);
});

export async function start(port = 3005) {
  return app.listen({ port });
}

if (import.meta.url === `file://${process.argv[1]}`) start().then(() => console.log('Hono example listening on 3005'));
