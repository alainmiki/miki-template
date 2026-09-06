/*
Minimal NestJS integration example (TypeScript flavor shown).

This file is an illustrative snippet and is NOT executed by the
smoke-test (NestJS requires heavier deps). Use it as a guide.

// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as miki from 'miki-template';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  // Wire miki into underlying Express instance
  miki.setupExpress(expressApp, { extension: 'html', views: './views' });
  await app.listen(3006);
}

bootstrap();

*/

// Plain JS note: If you use Nest with JS, the same pattern applies:
// obtain the underlying Express instance and call miki.setupExpress(...)
