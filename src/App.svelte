<script>
  import { currentTeam } from './lib/team.js'
  import TeamPicker from './components/TeamPicker.svelte'
  import TabBar from './components/TabBar.svelte'

  let tab = $state(localStorage.getItem('dj.tab') || 'lineup')
  function setTab(t) {
    tab = t
    localStorage.setItem('dj.tab', t)
  }
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
      <div class="panel">Lineup screen coming in Task 6.</div>
    {:else}
      <div class="panel">Game screen coming in Task 7.</div>
    {/if}
  </main>

  <TabBar {tab} onchange={setTab} />
{/if}
