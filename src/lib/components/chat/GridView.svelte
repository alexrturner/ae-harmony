<script lang="ts">
  import type { Chat } from '$lib/types/chat'
  
  export let chats: Chat[] = [];
  export let onChatClick: (chatId: string) => void;

  // recent first
  $: sortedChats = [...chats]
    .filter(chat => chat.totalSize > 0)
    .sort((a, b) => 
      new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );

  function createGradient(colors: string[]) {
    return `linear-gradient(90deg, ${colors.join(', ')})`;
  }
</script>

<div class="view--grid">
  {#each sortedChats as chat}
    <button 
      class="pixel" 
      on:click={() => onChatClick(chat.id)}
      style="background: {createGradient(chat.participantColors)}"
    >
      <!-- <div class="details">
        {#each chat.participantNames as name, i}
          <span>{name}</span>
          <span class="heart">❤</span>
          {#if i < chat.participantNames.length - 1}
            <br>
          {/if}
        {/each}
        <span class="size">{Math.round((chat.totalSize || 0) / 1024)}KB</span>
      </div> -->
    </button>
  {/each}
</div>

<style>
  
  .view--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--pixel-size), var(--pixel-size)));
    gap: 0.5rem;
    height: 100%;
    overflow: auto;

  }
  .pixel {
    width: var(--pixel-size);
    height: var(--pixel-size);
    padding: 0;
    border: none;
    position: relative;
    cursor: pointer;
  }

  .constellation-container {
    padding: 0 !important;
  }
  .view--grid {
    grid-template-columns: 1fr;
    gap: 0;
    height: 100vh;
    padding: 0;
  }
  .view--grid .pixel {
    width: initial;
    height: initial;
  }

  

  .details {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--cc-bg);
    /* border: 1px solid var(--cc-primary); */
    padding: 0.5rem;
    border-radius: 4px;
    white-space: nowrap;
    text-align: center;
    z-index: 10;
  }

  .pixel:hover .details {
    display: block;
  }

  .heart {
    color: var(--cc-primary);
  }

  .size {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.8em;
    opacity: 0.8;
  }
</style> 