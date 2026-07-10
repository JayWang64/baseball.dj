<script>
  import { lineup } from '../lib/lineup.js'
  import { engine } from '../lib/audio.js'
  import CheerGrid from './CheerGrid.svelte'

  let { team } = $props()
  const nowPlaying = engine.nowPlaying
  const paused = engine.paused

  const present = $derived(
    $lineup.order.filter((n) => !$lineup.absent.includes(n))
  )
  const batterName = $derived(present[$lineup.batterIndex] ?? null)
  const batter = $derived(team.players.find((p) => p.name === batterName) ?? null)
  const onDeck = $derived(
    present.length > 1 ? present[($lineup.batterIndex + 1) % present.length] : null
  )
  const batterUrls = $derived(
    batter ? [batter.intro, batter.walkup?.url].filter(Boolean) : []
  )
  const playing = $derived(!!$nowPlaying)
  // pause/resume only apply when the CURRENT batter's audio is what's loaded;
  // otherwise ▶ starts this batter's song (e.g. right after NEXT)
  const batterActive = $derived(
    playing && batterUrls.length > 0 && batterUrls.includes($nowPlaying.urls[0])
  )

  function onPlayPause() {
    if (batterActive) {
      if ($paused) engine.resume()
      else engine.pause()
    } else if (batterUrls.length) {
      engine.playSequence(batterUrls, { onDone: () => lineup.advance() })
    }
  }
</script>

<h1 class="screen-title">GAME DAY</h1>

{#if !batter}
  <div class="panel">No lineup yet — set today's batting order on the Lineup tab.</div>
{:else}
  <div class="panel now-panel" class:playing={batterActive && !$paused}>
    <div class="now-info">
      <div class="batter-label">NOW BATTING</div>
      <div class="batter-name">{batter.name}</div>
      <div class="batter-meta">
        № {batter.number ?? '?'}
        {#if batter.walkup}
          · ♪ {batter.walkup.title}{#if batter.walkup.placeholder} <span class="warn-chip">song pending</span>{/if}
        {:else}
          · <span class="warn-chip">no song</span>
        {/if}
      </div>
    </div>
    <div class="transport">
      <button
        class="t-btn t-play"
        disabled={!batterUrls.length}
        onclick={onPlayPause}
        aria-label={batterActive && !$paused ? 'Pause' : 'Play'}
      >
        {#if batterActive && !$paused}
          <svg viewBox="0 0 24 24"><path d="M6 5h4.4v14H6zM13.6 5H18v14h-4.4z" fill="currentColor"/></svg>
        {:else}
          <svg viewBox="0 0 24 24"><path d="M8 5v14l12-7z" fill="currentColor"/></svg>
        {/if}
      </button>
      <button
        class="t-btn t-stop"
        disabled={!playing}
        onclick={() => engine.stop()}
        aria-label="Stop"
      >
        <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>
      </button>
    </div>
  </div>

  <div class="batter-nav">
    <button class="btn" onclick={() => lineup.back()}>‹ BACK</button>
    <button class="btn" onclick={() => lineup.advance()}>NEXT ›</button>
  </div>

  {#if onDeck}
    <div class="ondeck">on deck: <b>{onDeck}</b></div>
  {/if}
{/if}

<CheerGrid cheers={team.cheers} />
