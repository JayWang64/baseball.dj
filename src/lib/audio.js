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

  const nowPlaying = writable(null)
  const armed = writable(false)

  async function arm() {
    if (!ctx) ctx = makeCtx()
    if (ctx.state === 'suspended') await ctx.resume()
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

  function stop() {
    gen++
    if (current?.source) {
      current.source.onended = null
      try { current.source.stop() } catch { /* already stopped */ }
    }
    current = null
    nowPlaying.set(null)
  }

  function fadeOut(ms = 1500) {
    gen++
    fadeCurrent(ms)
    nowPlaying.set(null)
  }

  return { arm, playSequence, stop, fadeOut, nowPlaying, armed }
}

export const engine = createEngine()
