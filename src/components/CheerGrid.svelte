<script>
  import { engine } from '../lib/audio.js'

  let { cheers } = $props()
  const nowPlaying = engine.nowPlaying
</script>

<div class="panel">
  <div class="panel-title">CHEERS</div>
  <div class="cheer-grid">
    {#each cheers as c (c.url)}
      <button
        class="cheer-btn"
        class:playing={$nowPlaying?.urls?.[0] === c.url}
        onclick={() => engine.playSequence([c.url])}
      >
        {c.title}
      </button>
    {/each}
  </div>
</div>
