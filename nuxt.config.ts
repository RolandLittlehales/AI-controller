import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false // Disable during development to avoid blocking
  },

  // CSS configuration
  css: ['~/styles/global.css.ts'],

  // Modules
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/eslint'
  ],

  // Vite configuration
  vite: {
    plugins: [
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@vanilla-extract/vite-plugin').vanillaExtractPlugin()
    ],
    optimizeDeps: {
      include: ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links']
    }
  },

  // Server configuration
  nitro: {
    experimental: {
      websocket: true
    }
  },

  // Runtime config
  runtimeConfig: {
    // Private keys (only available on server-side)
    // Public keys that are exposed to client-side
    public: {
      appName: 'AI Agent Manager',
      appVersion: '0.1.0'
    }
  },

  // App configuration
  app: {
    head: {
      title: 'AI Agent Manager',
      meta: [
        { name: 'description', content: 'A powerful web application for managing multiple terminal-based AI instances' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Build configuration
  build: {
    transpile: []
  },

  // Compatibility
  compatibilityDate: '2024-11-01'
})