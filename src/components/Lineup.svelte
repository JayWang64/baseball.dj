<script>
  import { flip } from 'svelte/animate'
  import { lineup } from '../lib/lineup.js'

  let { team } = $props()

  let dragging = $state(null)

  const rows = $derived.by(() => {
    let rank = 0
    return $lineup.order
      .map((name) => {
        const p = team.players.find((pp) => pp.name === name)
        if (!p) return null
        const absent = $lineup.absent.includes(name)
        return { p, absent, rank: absent ? null : ++rank }
      })
      .filter(Boolean)
  })
  const presentRows = $derived(rows.filter((r) => !r.absent))

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
  <div class="lock-bar">
    <button class="btn" onclick={() => lineup.setLocked(false)}>✎ EDIT LINEUP</button>
    <button class="btn danger" onclick={() => lineup.resetGame()}>RESET ORDER</button>
  </div>

  <div class="panel">
    <div class="panel-title">BATTING ORDER · LOCKED</div>
    {#if !presentRows.length}
      <div class="toast-warn">no lineup set — unlock to build one</div>
    {/if}
    {#each presentRows as { p, rank } (p.name)}
      <div class="lineup-row in">
        <span class="lineup-order">{rank}</span>
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
{:else}
  <div class="lock-bar">
    <button class="btn" onclick={() => lineup.selectAll()}>✓ SELECT ALL</button>
    <button class="btn amber lock-btn" disabled={!presentRows.length} onclick={() => lineup.setLocked(true)}>
      🔒 LOCK
    </button>
  </div>

  <div class="panel">
    <div class="panel-title">DRAG ≡ TO REORDER · UNCHECK IF ABSENT</div>
    {#each rows as { p, absent, rank } (p.name)}
      <div
        class="lineup-row"
        class:in={!absent}
        class:absent-row={absent}
        class:dragging={dragging === p.name}
        data-player={p.name}
        animate:flip={{ duration: 150 }}
      >
        <input
          type="checkbox"
          class="attend"
          checked={!absent}
          onchange={() => lineup.toggle(p.name)}
          title={absent ? 'Absent — check to put back in' : 'Attending — uncheck if absent'}
        />
        <span
          class="drag-handle"
          onpointerdown={(e) => dragStart(e, p.name)}
          onpointermove={dragMove}
          onpointerup={dragEnd}
          onpointercancel={dragEnd}
        >≡</span>
        <span class="lineup-order">{absent ? '–' : rank}</span>
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
{/if}
