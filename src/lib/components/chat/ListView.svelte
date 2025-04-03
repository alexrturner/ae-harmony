<script lang="ts">
  import type { Chat } from '$lib/types/chat'
  
  export let chats: Chat[] = [];
  export let currentUser: any;
  export let onChatClick: (chatId: string) => void;
</script>

<div class="view--list">
  {#each chats as chat}
    <button class="chat-item" on:click={() => onChatClick(chat.id)}>
      <div class="chat-participants">
        {#if chat.participantNames && chat.participantNames.length > 0}
          <div class="participant left" 
               style="color: {chat.participantColors?.[0]}">
            {chat.participantNames[0]}
          </div>
          {#if chat.participantNames.length > 1}
            <div class="participant right" 
                 style="color: {chat.participantColors?.[1]}">
              {chat.participantNames[1]}
              {#if chat.participantNames.length > 2}
                <span class="more">+{chat.participantNames.length - 2}</span>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
      <div class="chat-meta">
        {#if currentUser && chat.participants?.includes(currentUser.id)}
          <!-- you -->
        {/if}
      </div>
    </button>
  {/each}
</div>

<style>
  .view--list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100%;
    overflow-y: auto;
  }

  .chat-item {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    background: var(--cc-bg-alt, #f5f5f5);
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 100%;
    text-align: left;
    border: none;
  }

  .chat-item:hover {
    transform: translateX(5px);
  }

  .chat-participants {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-weight: 500;
  }

  .participant {
    font-size: 1rem;
  }

  .participant.right {
    text-align: right;
  }

  .more {
    font-size: 0.8rem;
    opacity: 0.7;
    margin-left: 0.5rem;
  }

  .chat-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }

  .chat-item-date {
    font-size: 0.8rem;
    opacity: 0.7;
  }
</style> 