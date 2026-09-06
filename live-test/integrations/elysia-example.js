import { Elysia } from 'elysia';
import path from 'path';
import miki from '../../src/esm.mjs';

const app = new Elysia();

app.get('/', async () => {
  const html = await miki.asyncRender('home', {}, { views: path.resolve('./live-test/views') });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});

export async function start(port = 3004) {
  return app.listen({ port });
}

if (import.meta.url === `file://${process.argv[1]}`) start().then(() => console.log('Elysia example listening on 3004'));
