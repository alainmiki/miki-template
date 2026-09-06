const Koa = require('koa');
const path = require('path');
const miki = require('../../');

const app = new Koa();

app.context.render = async function (view, locals = {}) {
  const html = await miki.asyncRender(view, locals, { views: path.resolve(__dirname, '..', 'views') });
  this.type = 'text/html';
  this.body = html;
};

app.use(async (ctx) => {
  await ctx.render('home', { user: 'KoaUser', title: 'KoaCard' });
});

function start(port = 3001, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    try {
      const srv = app.listen(port, host, () => {
        console.log('Koa example listening on', port);
        resolve(srv);
      });
    } catch (err) { reject(err); }
  });
}

if (require.main === module) start().catch(err => { console.error(err); process.exit(1); });

module.exports = { app, start };
