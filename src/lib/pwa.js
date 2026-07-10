import { writable } from 'svelte/store'
import { registerSW } from 'virtual:pwa-register'

// true once every asset (songs included) is cached and the app works offline
export const fieldReady = writable(
  // a controlling service worker means a previous visit finished caching
  typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller
)

registerSW({
  immediate: true,
  onOfflineReady() {
    fieldReady.set(true)
  },
})
