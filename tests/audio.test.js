import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { createEngine } from '../src/lib/audio.js'

class FakeParam {
  constructor(v) {
    this.value = v
    this.events = []
  }
  setValueAtTime(v, t) { this.events.push(['set', v, t]) }
  linearRampToValueAtTime(v, t) { this.events.push(['ramp', v, t]) }
  cancelScheduledValues(t) { this.events.push(['cancel', t]) }
}

class FakeGain {
  constructor() { this.gain = new FakeParam(1) }
  connect() {}
  disconnect() {}
}

class FakeSource {
  constructor() {
    this.buffer = null
    this.onended = null
    this.started = false
    this.stopped = false
  }
  connect() {}
  start() { this.started = true }
  stop() {
    this.stopped = true
    // real Web Audio fires ended on stop()
    if (this.onended) this.onended()
  }
}

class FakeCtx {
  constructor() {
    this.currentTime = 0
    this.destination = {}
    this.state = 'running'
    this.sources = []
    this.gains = []
  }
  suspend() { this.state = 'suspended'; return Promise.resolve() }
  resume() { this.state = 'running'; return Promise.resolve() }
  createGain() { const g = new FakeGain(); this.gains.push(g); return g }
  createBufferSource() { const s = new FakeSource(); this.sources.push(s); return s }
  decodeAudioData(ab) { return Promise.resolve({ duration: 1, bytes: ab }) }
}

let ctx, fetchCalls, engine

beforeEach(() => {
  ctx = new FakeCtx()
  fetchCalls = []
  engine = createEngine({
    contextFactory: () => ctx,
    fetchFn: (url) => {
      fetchCalls.push(url)
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) })
    },
  })
})

const tick = () => new Promise((r) => setTimeout(r, 0))

describe('audio engine', () => {
  it('plays a sequence, advancing on ended, then clears nowPlaying', async () => {
    let done = false
    await engine.playSequence(['a.mp3', 'b.mp3'], { onDone: () => (done = true) })
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].started).toBe(true)
    expect(get(engine.nowPlaying)).toEqual({ urls: ['a.mp3', 'b.mp3'], index: 0 })

    ctx.sources[0].onended()
    await tick()
    expect(ctx.sources).toHaveLength(2)
    expect(ctx.sources[1].started).toBe(true)
    expect(get(engine.nowPlaying)).toEqual({ urls: ['a.mp3', 'b.mp3'], index: 1 })

    ctx.sources[1].onended()
    await tick()
    expect(get(engine.nowPlaying)).toBeNull()
    expect(done).toBe(true)
  })

  it('interrupting fades the old sound and plays the new one', async () => {
    await engine.playSequence(['a.mp3'])
    const firstGain = ctx.gains[0]
    const firstSource = ctx.sources[0]

    await engine.playSequence(['b.mp3'])
    expect(firstGain.gain.events.some(([kind, v]) => kind === 'ramp' && v === 0)).toBe(true)
    expect(firstSource.stopped).toBe(true)
    const last = ctx.sources[ctx.sources.length - 1]
    expect(last.started).toBe(true)
    expect(get(engine.nowPlaying)).toEqual({ urls: ['b.mp3'], index: 0 })
  })

  it('stop() halts playback and clears nowPlaying without advancing', async () => {
    await engine.playSequence(['a.mp3', 'b.mp3'])
    engine.stop()
    await tick()
    expect(get(engine.nowPlaying)).toBeNull()
    expect(ctx.sources).toHaveLength(1)
  })

  it('caches decoded buffers per url', async () => {
    await engine.playSequence(['a.mp3'])
    engine.stop()
    await engine.playSequence(['a.mp3'])
    expect(fetchCalls.filter((u) => u === 'a.mp3')).toHaveLength(1)
  })

  it('pause suspends the context and resume/new-play recovers it', async () => {
    await engine.playSequence(['a.mp3'])
    engine.pause()
    expect(ctx.state).toBe('suspended')
    expect(get(engine.paused)).toBe(true)
    engine.resume()
    expect(ctx.state).toBe('running')
    expect(get(engine.paused)).toBe(false)
    engine.pause()
    await engine.playSequence(['b.mp3']) // starting fresh audio un-pauses
    expect(ctx.state).toBe('running')
    expect(get(engine.paused)).toBe(false)
  })

  it('stop while paused resumes the context so future plays are audible', async () => {
    await engine.playSequence(['a.mp3'])
    engine.pause()
    engine.stop()
    expect(ctx.state).toBe('running')
    expect(get(engine.paused)).toBe(false)
  })

  it('fadeOut ramps gain to zero and clears nowPlaying', async () => {
    await engine.playSequence(['a.mp3'])
    engine.fadeOut(1500)
    expect(ctx.gains[0].gain.events.some(([kind, v]) => kind === 'ramp' && v === 0)).toBe(true)
    expect(get(engine.nowPlaying)).toBeNull()
  })
})
