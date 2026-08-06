<script>
  import { fade, fly } from 'svelte/transition'
  import { engine } from '../lib/audio.js'

  let { items, onclose } = $props()
  const nowPlaying = engine.nowPlaying

  function fmt(sec) {
    if (sec == null) return ''
    const m = Math.floor(sec / 60)
    const s = String(sec % 60).padStart(2, '0')
    return `${m}:${s}`
  }
</script>

<div class="drawer-backdrop" transition:fade={{ duration: 120 }} onclick={onclose} role="presentation"></div>
<div class="organ-sheet" transition:fly={{ y: 30, duration: 180 }}>
  <div class="organ-head">
    <span class="panel-title">BALLPARK ORGAN</span>
    <button class="organ-close" onclick={onclose} aria-label="Close">✕</button>
  </div>
  <div class="organ-list">
    {#each items as item, i (item.url)}
      <button
        class="organ-row"
        class:playing={$nowPlaying?.urls?.[0] === item.url}
        onclick={() => engine.playSequence([item.url])}
      >
        <span class="organ-play">▶</span>
        <span class="organ-name"><b class="organ-no">{String(i + 1).padStart(2, '0')}.</b> {item.title}</span>
        <span class="organ-dur">{fmt(item.duration)}</span>
      </button>
    {/each}
  </div>
</div>
