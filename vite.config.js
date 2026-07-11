import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/baseball.dj/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,mp3,json,woff2,svg,png}'],
        // party tracks are full-length songs (~35 MB) — nice-to-have, streamed
        // and runtime-cached rather than blocking FIELD READY
        globIgnores: ['**/shared/party/**'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // safety net: if the big precache hasn't finished, any song that gets
        // played (or refetched) online is cached individually for offline use
        runtimeCaching: [
          {
            urlPattern: /\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-runtime',
              expiration: { maxEntries: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'baseball.dj',
        short_name: 'baseball.dj',
        start_url: '.',
        display: 'standalone',
        background_color: '#102e21',
        theme_color: '#102e21',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})
