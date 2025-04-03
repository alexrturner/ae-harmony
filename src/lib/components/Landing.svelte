<script lang="ts">
  
  import ChatConstellation from './ChatConstellation.svelte'

  let showLanding = true
  function handleTransition() {
    showLanding = false
  }

</script>
  
<div>

  {#if showLanding}
    
  <button class="btn btn-primary" on:click={handleTransition}>
    audio only dating 
  </button>
    
  {:else}

    <ChatConstellation />
  
  {/if}

</div>

