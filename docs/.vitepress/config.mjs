import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'miki-template',
  description: 'Django-style template engine for Node.js and Express',
  base: '/miki-template/',
  lang: 'en-US',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Integrations', link: '/integrations/' },
      { text: 'Performance', link: '/performance' },
      {
        text: 'GitHub',
        items: [
          { text: 'View Source', link: 'https://github.com/alainmiki/miki-template' },
          { text: 'Report Issue', link: 'https://github.com/alainmiki/miki-template/issues' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is miki-template?', link: '/guide/what-is-miki-template' },
            { text: 'Why miki-template?', link: '/guide/why-miki-template' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Core Features',
          items: [
            { text: 'Partial Templates', link: '/guide/partial-templates' },
            { text: 'Smart Template Discovery', link: '/guide/template-discovery' },
            { text: 'Template Inheritance', link: '/guide/template-inheritance' },
            { text: 'Filters', link: '/guide/filters' },
            { text: 'Tags', link: '/guide/tags' },
            { text: 'Security', link: '/guide/security' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Custom Tags', link: '/guide/custom-tags' },
            { text: 'Custom Filters', link: '/guide/custom-filters' },
            { text: 'Context Processors', link: '/guide/context-processors' },
            { text: 'Async Rendering', link: '/guide/async-rendering' },
            { text: 'Advanced Usage', link: '/guide/advanced-usage' }
          ]
        }
      ],
      '/api/': [
        { text: 'API Reference', link: '/api/' },
        { text: 'render()', link: '/api/render' },
        { text: 'compile()', link: '/api/compile' },
        { text: 'asyncRender()', link: '/api/async-render' },
        { text: 'renderPartial()', link: '/api/render-partial' },
        { text: 'setupExpress()', link: '/api/setup-express' },
        { text: 'Filters', link: '/api/filters' },
        { text: 'Tags', link: '/api/tags' },
        { text: 'Security', link: '/api/security' },
        { text: 'i18n', link: '/api/i18n' },
        { text: 'Libraries', link: '/api/libraries' },
        { text: 'Cache', link: '/api/cache' },
        { text: 'Finder', link: '/api/finder' }
      ],
      '/integrations/': [
        { text: 'Integrations', link: '/integrations/' },
        { text: 'Express', link: '/integrations/express' },
        { text: 'Koa', link: '/integrations/koa' },
        { text: 'Fastify', link: '/integrations/fastify' },
        { text: 'Hono', link: '/integrations/hono' },
        { text: 'Elysia', link: '/integrations/elysia' }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/alainmiki/miki-template' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Alain Miki'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    }
  },

  markdown: {
    config: (md) => {
      // You can add markdown-it plugins here if needed
    }
  }
});
