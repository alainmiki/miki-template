const Fastify = require('fastify');
const path = require('path');
const miki = require('../../');

const app = Fastify();

app.get('/', async (request, reply) => {
  const html = await miki.asyncRender('home', { user: 'FastifyUser', title: 'FastifyCard' }, { views: path.resolve(__dirname, '..', 'views') });
  reply.type('text/html').send(html);
});

if (require.main === module) {
  app.listen({ port: 3002, host: '127.0.0.1' })
    .then(() => console.log('Fastify example listening on 3002'))
    .catch(err => { console.error('Fastify failed to start', err); process.exit(1); });
}
module.exports = app;
