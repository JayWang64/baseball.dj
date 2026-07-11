// keep the screen awake while the Game tab is active — a locked phone kills
// the audio session mid-inning
let sentinel = null
let wanted = false

async function acquire() {
  if (!navigator.wakeLock || sentinel) return
  try {
    sentinel = await navigator.wakeLock.request('screen')
    sentinel.addEventListener('release', () => {
      sentinel = null
    })
  } catch {
    // denied (low battery mode etc.) — nothing to do
  }
}

export function holdWakeLock() {
  wanted = true
  acquire()
}

export function releaseWakeLock() {
  wanted = false
  sentinel?.release().catch(() => {})
  sentinel = null
}

// the OS drops wake locks when the tab is hidden — re-acquire on return
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') acquire()
  })
}
