# NestJS

Use miki-template with NestJS by wiring it into the underlying Express adapter instance.

## Setup

NestJS abstracts the HTTP adapter. To use miki-template, access the underlying Express app and call `setupExpress()`.

=== "TypeScript"

    ```typescript
    // main.ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';
    import * as miki from 'miki-template';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      const expressApp = app.getHttpAdapter().getInstance();
      miki.setupExpress(expressApp, { extension: 'html', views: './views' });
      await app.listen(3006);
    }

    bootstrap();
    ```

=== "CommonJS"

    ```javascript
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./app.module');
    const miki = require('miki-template');

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      const expressApp = app.getHttpAdapter().getInstance();
      miki.setupExpress(expressApp, { extension: 'html', views: './views' });
      await app.listen(3006);
    }

    bootstrap();
    ```

## Using in Controllers

Once `setupExpress()` is wired, use `res.render()` normally in Express-style controllers or middleware:

```typescript
import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  @Get()
  renderHome(@Req() req: Request, @Res() res: Response) {
    res.render('home', { user: req.user });
  }

  @Get('partials/:name')
  renderPartial(@Req() req: Request, @Res() res: Response) {
    res.render(`home#${req.params.name}`, { user: req.user });
  }
}
```

## Partial Rendering

```typescript
@Get('cards/:id')
renderCard(@Req() req: Request, @Res() res: Response) {
  res.render(`home#card`, { user: req.user });
}
```

## Next Steps

- [Integrations Overview](../index.md)
- [API Reference: setupExpress param($m) $m.Value -replace '([a-z][a-z0-9-]+)\.md
, '../.md' -replace '([a-z][a-z0-9-]+)
, '../.md' 
