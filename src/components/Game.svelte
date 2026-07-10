<script>
  import { lineup } from '../lib/lineup.js'
  import { engine } from '../lib/audio.js'
  import CheerGrid from './CheerGrid.svelte'

  let { team } = $props()
  const nowPlaying = engine.nowPlaying

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
  const batterPlaying = $derived(
    !!$nowPlaying && batterUrls.length > 0 && $nowPlaying.urls[0] === batterUrls[0]
  )

  function playBatter() {
    if (!batterUrls.length) return
    engine.playSequence(batterUrls, { onDone: () => lineup.advance() })
  }
</script>

<h1 class="screen-title">GAME DAY</h1>

{#if !batter}
  <div class="panel">No lineup yet — set today's batting order on the Lineup tab.</div>
{:else}
  <button class="batter-card" class:playing={batterPlaying} onclick={playBatter}>
    <div class="batter-label">NOW BATTING</div>
    {#if batter.number != null}<div class="batter-num">№ {batter.number}</div>{/if}
    <div class="batter-name">{batter.name}</div>
    {#if batter.walkup}
      <div class="batter-song">
        ♪ {batter.walkup.title}{#if batter.walkup.placeholder} · song pending{/if}
      </div>
      <div class="batter-hint">{batterPlaying ? 'PLAYING…' : 'TAP TO PLAY WALK-UP'}</div>
    {:else}
      <div class="toast-warn">no walk-up clip for {batter.name} yet</div>
    {/if}
  </button>

  <div class="batter-nav">
    <button class="btn" onclick={() => lineup.back()}>‹ BACK</button>
    <button class="btn" onclick={() => lineup.advance()}>NEXT ›</button>
  </div>

  {#if onDeck}
    <div class="ondeck">on deck: <b>{onDeck}</b></div>
  {/if}
{/if}

<CheerGrid cheers={team.cheers} />

<div class="dock">
  <button class="btn" disabled={!$nowPlaying} onclick={() => engine.fadeOut()}>FADE</button>
  <button class="btn danger" disabled={!$nowPlaying} onclick={() => engine.stop()}>■ STOP</button>
</div>
