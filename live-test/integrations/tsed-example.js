/*
Ts.ED integration (Express adapter)

This is an example snippet for Ts.ED users. Ts.ED can run on Express
or Koa — when using the Express adapter, obtain the raw Express app
and call `miki.setupExpress()` as shown.

// server.ts (snippet)
import { ServerLoader } from '@tsed/di';
import * as miki from 'miki-template';

async function bootstrap() {
  const server = await ServerLoader.bootstrap();
  // server.rawApp is the underlying Express/Koa instance depending on adapter
  miki.setupExpress(server.rawApp, { extension: 'html', views: './views' });
  await server.listen();
}

bootstrap();

*/

// Plain JS: same approach — call setupExpress on the underlying app.
