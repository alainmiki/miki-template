# TSDX / TSed (Ts.ED)

Use miki-template with Ts.ED (TSed) by wiring it into the underlying Express or Koa adapter.

## Setup

Ts.ED can run on Express or Koa. When using the Express adapter, obtain the raw Express app and call `setupExpress()`.

=== "TypeScript"

    ```typescript
    // server.ts
    import { ServerLoader } from '@tsed/di';
    import * as miki from 'miki-template';

    async function bootstrap() {
      const server = await ServerLoader.bootstrap();
      // server.rawApp is the underlying Express/Koa instance depending on adapter
      miki.setupExpress(server.rawApp, {
        extension: 'html',
        views: './views'
      });
      await server.listen();
    }

    bootstrap();
    ```

=== "CommonJS"

    ```javascript
    const { ServerLoader } = require('@tsed/di');
    const miki = require('miki-template');

    async function bootstrap() {
      const server = await ServerLoader.bootstrap();
      miki.setupExpress(server.rawApp, {
        extension: 'html',
        views: './views'
      });
      await server.listen();
    }

    bootstrap();
    ```

## Using in Controllers

Once wired, use `res.render()` in your Ts.ED controllers:

```typescript
import { Controller, Get, Req, Res } from '@tsed/common';
import { Request, Response } from 'express';

@Controller('/')
export class AppController {
  @Get('/')
  renderHome(@Req() req: Request, @Res() res: Response) {
    res.render('home', { user: req.user });
  }

  @Get('/partials/:name')
  renderPartial(@Req() req: Request, @Res() res: Response) {
    res.render(`home#${req.params.name}`, { user: req.user });
  }
}
```

## Partial Rendering

```typescript
@Get('/cards/:id')
renderCard(@Req() req: Request, @Res() res: Response) {
  res.render(`home#card`, { user: req.user });
}
```

## Next Steps

- [Integrations Overview](../)
- [API Reference: setupExpress](../api/setup-express)
