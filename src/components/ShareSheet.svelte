<script>
  import { fade } from 'svelte/transition'
  import QRCode from 'qrcode'

  let { team, onclose } = $props()

  const url = location.href
  const blurb = `⚾ ${team.name} walk-up music & cheers — tap once while you have internet and your phone is game-ready forever: ${url}`

  let canvas = $state(null)
  $effect(() => {
    if (canvas) {
      QRCode.toCanvas(canvas, url, {
        width: 240,
        margin: 2,
        color: { dark: '#0b231a', light: '#f4efe2' },
      })
    }
  })

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ text: blurb }) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(blurb)
      copied = true
    }
  }
  let copied = $state(false)
</script>

<div class="drawer-backdrop" transition:fade={{ duration: 120 }} onclick={onclose} role="presentation"></div>
<div class="share-sheet" transition:fade={{ duration: 150 }}>
  <div class="panel-title">SHARE WITH THE TEAM</div>
  <canvas bind:this={canvas} class="share-qr"></canvas>
  <div class="share-note">
    Scan → tap once with internet → game-ready forever (works offline after).
  </div>
  <button class="btn amber" onclick={share}>
    {copied ? '✓ COPIED — PASTE IN THE GROUP CHAT' : '📤 SHARE LINK'}
  </button>
  <button class="btn" onclick={onclose}>CLOSE</button>
</div>
