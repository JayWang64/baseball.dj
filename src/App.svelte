<script>
  import { currentTeam, teamKey } from './lib/team.js'
  import { lineup } from './lib/lineup.js'
  import TeamPicker from './components/TeamPicker.svelte'
  import TabBar from './components/TabBar.svelte'
  import Lineup from './components/Lineup.svelte'
  import Game from './components/Game.svelte'
  import ShareSheet from './components/ShareSheet.svelte'
  import { engine } from './lib/audio.js'
  import { fieldReady } from './lib/pwa.js'
  import { holdWakeLock, releaseWakeLock } from './lib/wakelock.js'

  const armed = engine.armed
  let tab = $state(localStorage.getItem('dj.tab') || 'lineup')
  let shareOpen = $state(false)
  function setTab(t) {
    tab = t
    localStorage.setItem('dj.tab', t)
  }

  $effect(() => {
    if ($currentTeam && tab === 'game') holdWakeLock()
    else releaseWakeLock()
  })

  $effect(() => {
    if ($currentTeam)
      lineup.init(
        teamKey($currentTeam),
        $currentTeam.team.players.map((p) => p.name)
      )
  })
</script>

{#if !$currentTeam}
  <TeamPicker />
{:else}
  <header class="topbar">
    <div class="topbar-inner">
      <button class="brand" onclick={() => currentTeam.set(null)} title="Switch team">
        <span class="brand-ball" aria-hidden="true"></span>
        <span class="brand-text">BASEBALL.DJ</span>
        <span class="brand-sub">{$currentTeam.team.name}</span>
      </button>
      <span class="net-badge" class:ready={$fieldReady} title={$fieldReady ? 'All songs cached — works with no signal' : 'Still downloading songs — stay on wifi'}>
        {$fieldReady ? '⚡ FIELD READY' : '⏳ CACHING…'}
      </span>
      <button class="share-btn" onclick={() => (shareOpen = true)} aria-label="Share with the team">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg>
      </button>
    </div>
  </header>

  <main class="view">
    {#if tab === 'lineup'}
      <Lineup team={$currentTeam.team} />
    {:else}
      <Game team={$currentTeam.team} />
    {/if}
  </main>

  <TabBar {tab} onchange={setTab} />

  {#if shareOpen}
    <ShareSheet team={$currentTeam.team} onclose={() => (shareOpen = false)} />
  {/if}

  {#if !$armed}
    <div class="arm-overlay">
      <button class="btn amber" onclick={() => engine.arm()}>🔊 TAP TO ARM AUDIO</button>
      <div class="arm-note">
        One tap unlocks the speaker for the game — required by phone browsers.
      </div>
    </div>
  {/if}
{/if}
