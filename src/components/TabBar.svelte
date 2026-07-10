<script>
  let { tab, onchange } = $props()
</script>

<nav class="tabbar">
  <button class="tab" class:active={tab === 'lineup'} onclick={() => onchange('lineup')}>
    <svg viewBox="0 0 24 24"><path d="M4 5h10M4 9h10M4 13h10M4 17h10" stroke-width="2.2" stroke-linecap="round"/><circle cx="18.5" cy="7" r="2.6"/><path d="M15 17.5c0-2 1.6-3.4 3.5-3.4s3.5 1.4 3.5 3.4" stroke-width="2"/></svg>
    <span>Lineup</span>
  </button>
  <button class="tab" class:active={tab === 'game'} onclick={() => onchange('game')}>
    <svg viewBox="0 0 24 24"><path d="M9 18.5V5.5l11-2.2v13" stroke-width="2.2" stroke-linejoin="round"/><circle cx="6.4" cy="18.5" r="2.7"/><circle cx="17.4" cy="16.3" r="2.7"/></svg>
    <span>Game</span>
  </button>
</nav>
