<script lang="ts">
  import { goto } from '$app/navigation'
  import { pb } from '$lib/pocketbase'
  import { currentUser } from '$lib/stores/user'
  import type { Chat } from '$lib/types/chat'
  import { onDestroy, onMount } from 'svelte'
  import GridView from './chat/GridView.svelte'
  import ListView from './chat/ListView.svelte'
  import TreemapView from './chat/TreemapView.svelte'

  export let initialChats: Chat[] = []

  
  let viewMode: 'grid' | 'treemap' | 'list' = 'grid'
  
  let chats: Chat[] = initialChats
  let loading = false
  let isUnmounted = false

  // user store changes
  $: user = $currentUser

  function newColour(): string {
    const hue = Math.random() * 360
    return `hsl(${hue}, 70%, 50%)`
  }

  async function refreshChats() {
    if (isUnmounted || !user) return

    try {
      loading = true
      
      const chatRecords = await pb.collection('chats').getFullList({
        expand: 'participants',
        sort: '-lastMessageDate'
      })

      if (isUnmounted) return

      const maxSize = Math.max(...chatRecords.map((c: any) => c.totalSize || 0))
      
      const enhancedChats = []
      
      for (const chat of chatRecords) {
        if (isUnmounted) return
        
        const participantNames = []
        const participantColors = []
        
        if (chat.expand?.participants) {
          for (const participant of chat.expand.participants) {
            participantNames.push(participant.username || 'cutie')
            participantColors.push(participant.colour || newColour())
          }
        }
        
        enhancedChats.push({
          ...chat,
          color: newColour(),
          normalizedSize: maxSize > 0 ? (chat.totalSize || 0) / maxSize : 0,
          participantNames,
          participantColors,
          totalSize: chat.totalSize || 0,
          lastMessageDate: chat.lastMessageDate || new Date().toISOString()
        })
      }
      
      chats = enhancedChats as Chat[]
    } catch (error) {
      if (!isUnmounted) {
        console.error('Error refreshing chats:', error)
      }
    } finally {
      if (!isUnmounted) {
        loading = false
      }
    }
  }

  function navigateToChat(chatId: string) {
    goto(`/chat/${chatId}`)
  }

  function changeViewMode(mode: 'list' | 'treemap' | 'grid') {
    viewMode = mode
    refreshChats()
  }

  // update
  onMount(async () => {
    isUnmounted = false
    
    const unsubscribe = await pb.collection('chats').subscribe('*', () => {
      refreshChats()
    })

    onDestroy(() => {
      isUnmounted = true
      unsubscribe()
    })
  })
</script>

<!-- <div class="view-controls">
  <button 
    class:active={viewMode === 'grid'} 
    on:click={() => changeViewMode('grid')}>
    recent
  </button>
  <button 
    class:active={viewMode === 'treemap'} 
    on:click={() => changeViewMode('treemap')}>
    size
  </button>
</div> -->

<div class="constellation-container">
  {#if loading}
    
      <!-- loading -->
    
  {:else}

    {#if viewMode === 'list'}
      <ListView {chats} currentUser={user} onChatClick={navigateToChat} />
    {:else if viewMode === 'treemap'}
      <TreemapView {chats} onChatClick={navigateToChat} />
    {:else if viewMode === 'grid'}
      <GridView {chats} onChatClick={navigateToChat} />
    {/if}
  {/if}
</div>

<style>
  .constellation-container {
    position: relative;
    width: 100%;
    background-color: var(--cc-bg);
    /* padding: 1rem; */
    overflow: hidden;
  }

  .constellation-container:has(.view--treemap) {
    position: absolute;
    top: 0;
    right: 0;
    left: var(--sidebar-width);
    bottom: 0;
    height: 100dvh;
    width: calc(100vw - var(--sidebar-width));
    padding: 0;
    pointer-events: auto;
  }

  .view-controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 1rem;
    position: absolute;
    z-index: 100;
    right: 0;
  }

  .view-controls button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--cc-primary);
    background: transparent;
    color: var(--cc-text);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: monospace;
  }

  .view-controls button.active {
    background-color: var(--cc-primary);
    color: white;
  }

  .loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    color: var(--cc-text);
  }
</style> 