<script>
  import { fly, fade } from 'svelte/transition'
  import { lineup } from '../lib/lineup.js'
  import { engine } from '../lib/audio.js'
  import CheerGrid from './CheerGrid.svelte'

  let { team } = $props()
  const nowPlaying = engine.nowPlaying
  const paused = engine.paused

  let orderOpen = $state(false)

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
  const batterActive = $derived(
    playing && batterUrls.length > 0 && batterUrls.includes($nowPlaying.urls[0])
  )

  // one shared transport: pause/resume whatever is playing (kid song or cheer);
  // when idle, ▶ starts the current batter's song
  function onPlayPause() {
    if (playing) {
      if ($paused) engine.resume()
      else engine.pause()
    } else if (batterUrls.length) {
      engine.playSequence(batterUrls, { onDone: () => lineup.advance() })
    }
  }

  // moving to another batter always cuts the current kid's song
  function stopBatterSong() {
    if (batterActive) engine.fadeOut(250)
  }
  function goNext() {
    stopBatterSong()
    lineup.advance()
  }
  function goBack() {
    stopBatterSong()
    lineup.back()
  }
  function jump(i) {
    if (i !== $lineup.batterIndex) {
      stopBatterSong()
      lineup.jumpTo(i)
    }
    orderOpen = false
  }
</script>

<h1 class="screen-title">GAME DAY</h1>

{#if !batter}
  <div class="panel">No lineup yet — set today's batting order on the Lineup tab.</div>
{:else}
  <div class="panel now-panel" class:playing={batterActive && !$paused}>
    <div class="now-row">
      <div class="now-info">
        <div class="batter-label">NOW BATTING</div>
        <div class="batter-num">№ {batter.number ?? '?'}</div>
        <div class="batter-name">{batter.name}</div>
        <div class="batter-meta">
          {#if batter.walkup}
            ♪ {batter.walkup.title}{#if batter.walkup.placeholder} <span class="warn-chip">song pending</span>{/if}
          {:else}
            <span class="warn-chip">no song</span>
          {/if}
        </div>
        {#if onDeck}
          <div class="ondeck">on deck: <b>{onDeck}</b></div>
        {/if}
      </div>
    </div>
    <div class="batter-nav">
      <button class="btn" onclick={goBack}>‹ BACK</button>
      <button class="btn" onclick={goNext}>NEXT ›</button>
    </div>
  </div>

  <div class="transport">
    <button
      class="t-btn t-play"
      disabled={!playing && !batterUrls.length}
      onclick={onPlayPause}
      aria-label={playing && !$paused ? 'Pause' : 'Play'}
    >
      {#if playing && !$paused}
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

{/if}

<CheerGrid cheers={team.cheers} />

{#if batter}
  <button class="order-fab" onclick={() => (orderOpen = true)} aria-label="Batting order">
    <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><text x="2" y="9" font-size="8" fill="currentColor" font-weight="bold">1</text><text x="2" y="21" font-size="8" fill="currentColor" font-weight="bold">2</text></svg>
    <span>ORDER</span>
  </button>

  {#if orderOpen}
    <div
      class="drawer-backdrop"
      transition:fade={{ duration: 120 }}
      onclick={() => (orderOpen = false)}
      role="presentation"
    ></div>
    <aside class="order-drawer" transition:fly={{ x: -320, duration: 180 }}>
      <div class="panel-title">BATTING ORDER · TAP TO JUMP</div>
      <div class="order-drawer-list">
        {#each present as name, i (name)}
          <button class="jump-row" class:active={i === $lineup.batterIndex} onclick={() => jump(i)}>
            <span class="lineup-order">{i + 1}</span>
            <span class="lineup-name">{name}</span>
            {#if i === $lineup.batterIndex}<span class="at-bat">AT BAT</span>{/if}
          </button>
        {/each}
      </div>
    </aside>
  {/if}
{/if}
