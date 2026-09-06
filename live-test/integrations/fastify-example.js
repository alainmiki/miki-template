const Fastify = require('fastify');
const path = require('path');
const miki = require('../');

const app = Fastify();

app.get('/', async (request, reply) => {
  const html = await miki.asyncRender('home', { user: 'FastifyUser', title: 'FastifyCard' }, { views: path.resolve(__dirname, '..', 'views') });
  reply.type('text/html').send(html);
});

if (require.main === module) app.listen(3002, () => console.log('Fastify example listening on 3002'));
module.exports = app;
