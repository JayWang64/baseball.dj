<script>
  import { currentTeam, teamKey } from './lib/team.js'
  import { lineup } from './lib/lineup.js'
  import TeamPicker from './components/TeamPicker.svelte'
  import TabBar from './components/TabBar.svelte'
  import Lineup from './components/Lineup.svelte'
  import Game from './components/Game.svelte'
  import { engine } from './lib/audio.js'
  import { fieldReady } from './lib/pwa.js'

  const armed = engine.armed
  let tab = $state(localStorage.getItem('dj.tab') || 'lineup')
  function setTab(t) {
    tab = t
    localStorage.setItem('dj.tab', t)
  }

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

  {#if !$armed}
    <div class="arm-overlay">
      <button class="btn amber" onclick={() => engine.arm()}>🔊 TAP TO ARM AUDIO</button>
      <div class="arm-note">
        One tap unlocks the speaker for the game — required by phone browsers.
      </div>
    </div>
  {/if}
{/if}
