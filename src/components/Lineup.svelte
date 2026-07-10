<script>
  import { lineup } from '../lib/lineup.js'

  let { team } = $props()

  const players = $derived(
    [...team.players].sort((a, b) => {
      const ia = $lineup.order.indexOf(a.name)
      const ib = $lineup.order.indexOf(b.name)
      if (ia === -1 && ib === -1) return a.name.localeCompare(b.name)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  )
</script>

<h1 class="screen-title">TODAY'S LINEUP</h1>

<div class="panel">
  <div class="panel-title">TAP TO ADD · ARROWS TO REORDER</div>
  {#each players as p (p.name)}
    {@const pos = $lineup.order.indexOf(p.name)}
    <div
      class="lineup-row"
      class:in={pos !== -1}
      onclick={() => lineup.toggle(p.name)}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && lineup.toggle(p.name)}
    >
      <span class="lineup-order">{pos === -1 ? '–' : pos + 1}</span>
      <span class="lineup-name">
        {p.name}
        {#if !p.walkup}<span class="warn-chip">no song</span>{/if}
        {#if p.walkup?.placeholder}<span class="warn-chip">song pending</span>{/if}
        {#if p.walkup}<small>{p.walkup.title}</small>{/if}
      </span>
      {#if p.number != null}<span class="lineup-num">#{p.number}</span>{/if}
      {#if pos !== -1}
        <span class="lineup-move">
          <button class="btn" onclick={(e) => { e.stopPropagation(); lineup.move(p.name, -1) }}>↑</button>
          <button class="btn" onclick={(e) => { e.stopPropagation(); lineup.move(p.name, 1) }}>↓</button>
        </span>
      {/if}
    </div>
  {/each}
</div>

{#if $lineup.order.length}
  <div class="panel" style="display:flex; justify-content:space-between; align-items:center;">
    <span>{$lineup.order.length} batting today</span>
    <button class="btn danger" onclick={() => lineup.resetGame()}>RESET TO TOP OF ORDER</button>
  </div>
{/if}
