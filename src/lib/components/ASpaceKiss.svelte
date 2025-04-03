<script lang="ts">
  import { selectedTheme } from '$lib/stores/theme'
  
  function stellarNursery(count: number) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1
    }));
  }
  
  let stars = stellarNursery(50);
  
  
  function SpaceKiss() {
    if ($selectedTheme === 'space') {
      $selectedTheme = 'light';
    } else {
      $selectedTheme = 'space';
      stars = stellarNursery(50);
    }
  }
</script>

{#if $selectedTheme === 'space'}
  <div class="sky">
    {#each stars as star}
      <div 
        class="star" 
        style="left: {star.x}%; top: {star.y}%; width: {star.size}px; height: {star.size}px;"
      ></div>
    {/each}
  </div>
{/if}

<button on:click={SpaceKiss} class="btn-sidebar space-kiss" aria-label="starry night">
  {#if $selectedTheme === 'space'}
    <div class="theme-icon">☾</div>
  {:else}
    <div class="theme-icon">☼</div>
  {/if}
</button>

<style>
  .sky {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    pointer-events: none;
  }
  
  .star {
    position: absolute;
    background-color: white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  .space-kiss {
    position: relative;
    z-index: 10000;
  }
  
  .space-kiss:hover {
    color: var(--kisskiss);
    border: 2px inset var(--cc-border) !important;
  }
  
  .theme-icon {
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style> 