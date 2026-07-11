import { writable } from 'svelte/store'

// Web Audio (not <audio>.volume) because iOS Safari ignores volume writes;
// gain ramps are the only reliable way to fade on iPhone.
export function createEngine({ contextFactory, fetchFn } = {}) {
  const makeCtx =
    contextFactory || (() => new (window.AudioContext || window.webkitAudioContext)())
  const doFetch = fetchFn || ((url) => fetch(url))

  let ctx = null
  const buffers = new Map()
  let current = null // { gain, source }
  let gen = 0
  let overlays = new Set() // one-shot layered sources (sfx, announcer calls)

  const nowPlaying = writable(null)
  const armed = writable(false)
  const paused = writable(false)

  // iOS mutes Web Audio when the ring/silent switch is on silent, but NOT
  // HTMLMediaElement playback. Keeping a silent looping <audio> element
  // playing switches the audio session to "media playback", which un-mutes
  // Web Audio regardless of the switch (the unmute.js trick).
  let keepAlive = null
  function ensurePlaybackSession() {
    if (keepAlive || typeof document === 'undefined') return
    keepAlive = document.createElement('audio')
    keepAlive.loop = true
    // ~0.05s of silence, 8kHz mono wav
    keepAlive.src =
      'data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YVYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    keepAlive.setAttribute('playsinline', '')
    keepAlive.play().catch(() => {
      keepAlive = null // retry on the next user gesture
    })
  }

  async function arm() {
    if (!ctx) ctx = makeCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    ensurePlaybackSession()
    armed.set(true)
  }

  async function getBuffer(url) {
    if (!buffers.has(url)) {
      const res = await doFetch(url)
      const ab = await res.arrayBuffer()
      buffers.set(url, await ctx.decodeAudioData(ab))
    }
    return buffers.get(url)
  }

  function fadeCurrent(ms) {
    if (!current) return
    const { gain, source } = current
    const t = ctx.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setValueAtTime(gain.gain.value ?? 1, t)
    gain.gain.linearRampToValueAtTime(0, t + ms / 1000)
    if (source) {
      source.onended = null
      try { source.stop(t + ms / 1000) } catch { /* already stopped */ }
    }
    current = null
  }

  async function playSequence(urls, { onDone } = {}) {
    await arm()
    paused.set(false)
    const myGen = ++gen
    fadeCurrent(300)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1, ctx.currentTime)
    gain.connect(ctx.destination)

    const playIndex = async (i) => {
      if (myGen !== gen) return
      if (i >= urls.length) {
        current = null
        nowPlaying.set(null)
        onDone?.()
        return
      }
      const buffer = await getBuffer(urls[i])
      if (myGen !== gen) return
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(gain)
      source.onended = () => playIndex(i + 1)
      current = { gain, source }
      nowPlaying.set({ urls, index: i })
      source.start()
    }
    await playIndex(0)
  }

  // layered one-shot on its own gain node: SFX play over the music untouched
  // (duck: 1), announcer calls duck the music to `duck` and restore after
  const overlayPlaying = writable(null)
  async function playOverlay(url, { duck = 1 } = {}) {
    await arm()
    const buffer = await getBuffer(url)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1, ctx.currentTime)
    gain.connect(ctx.destination)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(gain)
    const ducked = current
    if (ducked && duck < 1) {
      const t = ctx.currentTime
      ducked.gain.gain.cancelScheduledValues(t)
      ducked.gain.gain.setValueAtTime(ducked.gain.gain.value ?? 1, t)
      ducked.gain.gain.linearRampToValueAtTime(duck, t + 0.15)
    }
    const entry = { source, gain }
    overlays.add(entry)
    overlayPlaying.set(url)
    source.onended = () => {
      overlays.delete(entry)
      if (overlays.size === 0) overlayPlaying.set(null)
      // restore the music only if the same playback is still active
      if (duck < 1 && ducked && ducked === current) {
        const t = ctx.currentTime
        ducked.gain.gain.cancelScheduledValues(t)
        ducked.gain.gain.setValueAtTime(duck, t)
        ducked.gain.gain.linearRampToValueAtTime(1, t + 0.3)
      }
    }
    source.start()
  }

  function stopOverlays() {
    for (const { source } of overlays) {
      source.onended = null
      try { source.stop() } catch { /* already stopped */ }
    }
    overlays.clear()
    overlayPlaying.set(null)
  }

  function stop() {
    gen++
    stopOverlays()
    if (current?.source) {
      current.source.onended = null
      try { current.source.stop() } catch { /* already stopped */ }
    }
    current = null
    nowPlaying.set(null)
    if (ctx?.state === 'suspended') ctx.resume()
    paused.set(false)
  }

  function fadeOut(ms = 1500) {
    gen++
    fadeCurrent(ms)
    nowPlaying.set(null)
    paused.set(false)
  }

  // suspending the context freezes the buffer mid-note — the only way to
  // "pause" a Web Audio BufferSource
  function pause() {
    if (ctx?.state === 'running') ctx.suspend()
    paused.set(true)
  }

  function resume() {
    if (ctx?.state === 'suspended') ctx.resume()
    paused.set(false)
  }

  return { arm, playSequence, playOverlay, stop, fadeOut, pause, resume, nowPlaying, overlayPlaying, armed, paused }
}

export const engine = createEngine()
