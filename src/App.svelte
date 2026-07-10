<script>
  import { currentTeam, teamKey } from './lib/team.js'
  import { lineup } from './lib/lineup.js'
  import TeamPicker from './components/TeamPicker.svelte'
  import TabBar from './components/TabBar.svelte'
  import Lineup from './components/Lineup.svelte'

  let tab = $state(localStorage.getItem('dj.tab') || 'lineup')
  function setTab(t) {
    tab = t
    localStorage.setItem('dj.tab', t)
  }

  $effect(() => {
    if ($currentTeam) lineup.init(teamKey($currentTeam))
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
    </div>
  </header>

  <main class="view">
    {#if tab === 'lineup'}
      <Lineup team={$currentTeam.team} />
    {:else}
      <div class="panel">Game screen coming in Task 7.</div>
    {/if}
  </main>

  <TabBar {tab} onchange={setTab} />
{/if}
