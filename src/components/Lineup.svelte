<script>
  import { lineup } from '../lib/lineup.js'

  let { team } = $props()

  let dragging = $state(null)

  const inOrder = $derived(
    $lineup.order
      .map((name) => team.players.find((p) => p.name === name))
      .filter(Boolean)
  )
  const bench = $derived(
    team.players
      .filter((p) => !$lineup.order.includes(p.name))
      .sort((a, b) => a.name.localeCompare(b.name))
  )

  function dragStart(e, name) {
    e.preventDefault()
    dragging = name
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function dragMove(e) {
    if (!dragging) return
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-player]')
    const over = el?.dataset.player
    if (over && over !== dragging) lineup.reorder(dragging, over)
  }

  function dragEnd() {
    dragging = null
  }
</script>

<h1 class="screen-title">TODAY'S LINEUP</h1>

{#if $lineup.locked}
  <div class="panel">
    <div class="panel-title">BATTING ORDER · LOCKED</div>
    {#if !inOrder.length}
      <div class="toast-warn">no lineup set — unlock to build one</div>
    {/if}
    {#each inOrder as p, i (p.name)}
      <div class="lineup-row in">
        <span class="lineup-order">{i + 1}</span>
        <span class="lineup-name">
          {p.name}
          {#if !p.walkup}<span class="warn-chip">no song</span>{/if}
          {#if p.walkup?.placeholder}<span class="warn-chip">song pending</span>{/if}
          {#if p.walkup}<small>{p.walkup.title}</small>{/if}
        </span>
        {#if p.number != null}<span class="lineup-num">#{p.number}</span>{/if}
      </div>
    {/each}
  </div>

  <div class="lock-bar">
    <button class="btn" onclick={() => lineup.setLocked(false)}>✎ EDIT LINEUP</button>
    <button class="btn danger" onclick={() => lineup.resetGame()}>RESET TO TOP OF ORDER</button>
  </div>
{:else}
  <div class="panel">
    <div class="panel-title">BATTING TODAY · DRAG ≡ TO REORDER</div>
    {#if !inOrder.length}
      <div class="toast-warn">tap players below to add them</div>
    {/if}
    {#each inOrder as p, i (p.name)}
      <div class="lineup-row in" class:dragging={dragging === p.name} data-player={p.name}>
        <span
          class="drag-handle"
          onpointerdown={(e) => dragStart(e, p.name)}
          onpointermove={dragMove}
          onpointerup={dragEnd}
          onpointercancel={dragEnd}
        >≡</span>
        <span class="lineup-order">{i + 1}</span>
        <span class="lineup-name">
          {p.name}
          {#if !p.walkup}<span class="warn-chip">no song</span>{/if}
          {#if p.walkup?.placeholder}<span class="warn-chip">song pending</span>{/if}
          {#if p.walkup}<small>{p.walkup.title}</small>{/if}
        </span>
        {#if p.number != null}<span class="lineup-num">#{p.number}</span>{/if}
        <button class="btn remove-btn" onclick={() => lineup.toggle(p.name)} title="Move to bench">✕</button>
      </div>
    {/each}
  </div>

  {#if bench.length}
    <div class="panel">
      <div class="panel-head">
        <div class="panel-title">ON THE BENCH · TAP TO ADD</div>
        <button class="btn add-all-btn" onclick={() => lineup.addAll(bench.map((p) => p.name))}>
          + ADD ALL
        </button>
      </div>
      {#each bench as p (p.name)}
        <button class="lineup-row bench-row" onclick={() => lineup.toggle(p.name)}>
          <span class="lineup-order">+</span>
          <span class="lineup-name">
            {p.name}
            {#if !p.walkup}<span class="warn-chip">no song</span>{/if}
            {#if p.walkup}<small>{p.walkup.title}</small>{/if}
          </span>
          {#if p.number != null}<span class="lineup-num">#{p.number}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}

  <div class="lock-bar">
    <button class="btn amber" disabled={!inOrder.length} onclick={() => lineup.setLocked(true)}>
      🔒 LOCK LINEUP
    </button>
  </div>
{/if}
