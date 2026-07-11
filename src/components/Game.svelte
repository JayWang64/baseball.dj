<script>
  import { fly, fade } from 'svelte/transition'
  import { lineup } from '../lib/lineup.js'
  import { engine } from '../lib/audio.js'
  import SoundGrid from './SoundGrid.svelte'

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

  // long-press ▶ (500ms) skips the announcer intro and goes straight to the song
  let pressTimer = null
  let longFired = false
  function pressStart() {
    longFired = false
    if (!batter?.intro || !batter?.walkup) return
    pressTimer = setTimeout(() => {
      longFired = true
      engine.playSequence([batter.walkup.url], { onDone: () => lineup.advance() })
    }, 500)
  }
  function pressEnd() {
    clearTimeout(pressTimer)
  }
  function onPlayClick() {
    if (longFired) {
      longFired = false
      return
    }
    onPlayPause()
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

  function celebrate() {
    if (batter?.celebrate) engine.playSequence([batter.celebrate])
  }

  // ---- party mode: shuffled full-length tracks between innings ----
  let partyOn = $state(false)
  let partyWasOn = $state(false)
  let queue = []

  const isPartyUrl = (url) => team.party.some((t) => t.url === url)

  function playNextParty() {
    if (!queue.length) queue = [...team.party].sort(() => Math.random() - 0.5)
    const track = queue.shift()
    engine.playSequence([track.url], {
      onDone: () => {
        if (partyOn) playNextParty()
      },
    })
  }

  function startParty(resume = false) {
    partyOn = true
    partyWasOn = false
    if (!resume) queue = []
    playNextParty()
  }

  function stopParty() {
    partyOn = false
    partyWasOn = false
    engine.fadeOut(800)
  }

  // any non-party sound (walk-up, cheer) taking over pauses the party
  $effect(() => {
    if (partyOn && $nowPlaying && !isPartyUrl($nowPlaying.urls[0])) {
      partyOn = false
      partyWasOn = true
    }
  })

  function onStop() {
    if (partyOn) {
      partyOn = false
      partyWasOn = true
    }
    engine.stop()
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
        <div class="batter-headline">
          <span class="batter-name">{batter.name}</span>
          <span class="batter-num">№ {batter.number ?? '?'}</span>
        </div>
        <div class="batter-meta">
          {#if batter.walkup}
            ♪ {batter.walkup.title}
          {:else}
            <span class="warn-chip">no song</span>
          {/if}
        </div>
        {#if onDeck}
          <div class="ondeck">on deck: <b>{onDeck}</b></div>
        {/if}
      </div>
      {#if batter.celebrate}
        <button class="celebrate-btn" onclick={celebrate} title="He scored! Play celebration">🎉</button>
      {/if}
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
      onclick={onPlayClick}
      onpointerdown={pressStart}
      onpointerup={pressEnd}
      onpointerleave={pressEnd}
      onpointercancel={pressEnd}
      oncontextmenu={(e) => e.preventDefault()}
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
      onclick={onStop}
      aria-label="Stop"
    >
      <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>
    </button>
  </div>

  {#if team.party.length}
    <div class="party-bar">
      {#if partyOn}
        <button class="btn amber" onclick={stopParty}>🎉 PARTY ON — TAP TO END</button>
      {:else if partyWasOn}
        <button class="btn" onclick={() => startParty(true)}>▶ RESUME PARTY</button>
      {:else}
        <button class="btn" onclick={() => startParty()}>🎉 PARTY MODE</button>
      {/if}
    </div>
  {/if}

{/if}

<SoundGrid title="CHEERS" items={team.cheers} mode="music" />
<!-- SFX board hidden — league doesn't allow air horns etc. Re-enable with:
<SoundGrid title="SOUND FX · PLAY OVER THE MUSIC" items={team.sfx} mode="layer" small /> -->
<SoundGrid title="ANNOUNCER CALLS · DUCK THE MUSIC" items={team.calls} mode="duck" small />

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
