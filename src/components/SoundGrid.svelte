<script>
  import { engine } from '../lib/audio.js'

  // mode: 'music'   — one-at-a-time, fades out whatever is playing (cheers)
  //       'layer'   — plays on top of the music untouched (sfx)
  //       'duck'    — plays on top, ducking the music to 30% (announcer calls)
  let { title, items, mode = 'music', small = false } = $props()

  const nowPlaying = engine.nowPlaying
  const overlayPlaying = engine.overlayPlaying

  function play(item) {
    if (mode === 'music') engine.playSequence([item.url])
    else engine.playOverlay(item.url, { duck: mode === 'duck' ? 0.3 : 1 })
  }

  function isActive(item) {
    return mode === 'music'
      ? $nowPlaying?.urls?.[0] === item.url
      : $overlayPlaying === item.url
  }
</script>

{#if items.length}
  <div class="panel">
    <div class="panel-title">{title}</div>
    <div class="cheer-grid" class:sfx-grid={small}>
      {#each items as item (item.url)}
        <button
          class="cheer-btn"
          class:sfx-btn={small}
          class:playing={isActive(item)}
          onclick={() => play(item)}
        >
          {item.title}
        </button>
      {/each}
    </div>
  </div>
{/if}
