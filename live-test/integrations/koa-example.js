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

if (require.main === module) app.listen(3001, () => console.log('Koa example listening on 3001'));
module.exports = app;
