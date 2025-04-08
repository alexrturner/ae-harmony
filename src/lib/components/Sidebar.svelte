<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import type { App } from '$lib/app'
  import { pb } from '$lib/pocketbase'
  import { currentUser } from '$lib/stores/user'
  import { getImageURL } from '$lib/utils'
  import { Howl } from 'howler'
  import { onDestroy, onMount } from 'svelte'
  import ASpaceKiss from './ASpaceKiss.svelte'

  export let data
  let users: App.User[] = []
  let recentChats: Array<{ user: App.User; lastMessageTime: string }> = []
  let newUsers: App.User[] = []
  let loading = true
  let audioPlayers = new Map<string, Howl>()
  let isUnmounted = false

  $: currentUser.set(data.user)

  async function fetchUsers() {
    if (isUnmounted || !browser) return;

    try {
      loading = true;
      
      // all users except current user
      const records = await pb.collection('users').getList(1, 50, {
        filter: `id != "${$currentUser?.id}"`,
        sort: 'created'
      })

      if (isUnmounted) return;


      // all of your chats
      const chats = await pb.collection('chats').getList(1, 100, {
        filter: `participants ?~ "${$currentUser?.id}"`,
        sort: '-updated',
        expand: 'participants'
      });

      if (isUnmounted) return;

      // users you've chatted with
      const chatUserIds = new Set();
      recentChats = [];
      
      chats.items.forEach(chat => {
        const otherUserId = chat.participants.find(id => id !== $currentUser?.id);
        if (otherUserId) {
          const user = records.items.find(u => u.id === otherUserId);
          if (user) {
            chatUserIds.add(otherUserId);
            recentChats.push({
              user,
              lastMessageTime: chat.updated
            });
          }
        }
      });

      // users you haven't chatted with
      newUsers = records.items.filter(user => !chatUserIds.has(user.id));

    } catch (err) {
      if (!isUnmounted) {
        console.error('Error fetching users:', err);

        recentChats = [];
        newUsers = [];
      }
    } finally {
      if (!isUnmounted) {
        loading = false;
      }
    }
  }

  // again when you change name
  $: if ($currentUser && browser && !isUnmounted) {
    fetchUsers()
  }

  async function startChat(otherUserId: string) {
    if (isUnmounted || !browser) return;

    try {
        // verify current user
        if (!$currentUser?.id) {
            console.error('you do not exist');
            return;
        }

        // find the user to get their sound
        const user = users.find(u => u.id === otherUserId);
        if (user?.sound) {
            // stop any currently playing sound
            audioPlayers.forEach(sound => sound.stop());
            audioPlayers.clear();

            // play user sound
            const sound = new Howl({
                src: [pb.getFileUrl(user, user.sound)],
                onend: () => {
                    // sound plays, navigate to chat
                    navigateToChat(otherUserId);
                }
            });
            sound.play();
            audioPlayers.set(user.id, sound);
            return;
        }

        navigateToChat(otherUserId);
    } catch (err) {
      if (!isUnmounted) {
        console.error('error handling user interaction:', err);
      }
    }
  }

  async function navigateToChat(otherUserId: string) {
    if (isUnmounted || !browser) return;
    try {
        // check if chat exists
        const existingChat = await pb.collection('chats').getList(1, 1, {
            filter: `participants ?~ "${$currentUser?.id}" && participants ?~ "${otherUserId}"`
        });

        if (isUnmounted) return;

        // existing chat
        if (existingChat.items.length > 0) {
            goto(`/chat/${existingChat.items[0].id}`);
            return;
        }

        // new chat
        const newChat = await pb.collection('chats').create({
            participants: [$currentUser?.id, otherUserId]
        });

        if (isUnmounted) return;

        goto(`/chat/${newChat.id}`);
    } catch (err) {
      if (!isUnmounted) {
        console.error('Error navigating to chat:', err);
      }
    }
  }

  function handleLogout() {
    if (isUnmounted || !browser) return;

    pb.authStore.clear()
    goto('/')
  }

const CANVAS_SIZE = 40;
const PIXEL_SIZE = 2;
const GRID_SIZE = CANVAS_SIZE / PIXEL_SIZE;

const COLOR_PAIRS = [
    ['#FF69B4', '#32CD32'],
    ['#FFD700', '#228B22'],
    ['#FF4500', '#006400'],
    ['#9370DB', '#228B22'],
    ['#FF0000', '#355E3B'],
    ['#2289DB', '#228B22'],
    ['#87CEEB', '#228B22'],
    ['#FFA500', '#228B22'],
];


const FLOWERZ = [
    // bud
    [
        [0, 1, 1, 0],
        [1, 1, 1, 0],
        [0, 1, 1, 1],
        [1, 0, 1, 0],
    ],
    // petal
    [
        [1, 0, 1],
        [0, 1, 1],
        [1, 1, 0],
    ],
    // noise
    [
        [1, 0, 1, 1],
        [0, 1, 0, 1],
        [1, 1, 0, 0],
        [1, 0, 1, 0],
    ]
];

function giveFlower(ctx) {

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const [flowerColor, stemColor] = COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)];
    
    // Random template
    const template = FLOWERZ[Math.floor(Math.random() * FLOWERZ.length)];
    
    // stem
    const stemHeight = 6 + Math.floor(Math.random() * 4);
    
    ctx.fillStyle = stemColor;
    const stemX = GRID_SIZE / 2;
    const stemBottom = GRID_SIZE - 2;
    const stemTop = stemBottom - stemHeight;
    
    // noise
    for (let y = stemTop; y <= stemBottom; y++) {
        const xOffset = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        ctx.fillRect((stemX + xOffset) * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }

    
    ctx.fillStyle = flowerColor;
    const flowerX = Math.floor(stemX - template[0].length / 2);
    const flowerY = stemTop - template.length;
    
    for (let y = 0; y < template.length; y++) {
        for (let x = 0; x < template[y].length; x++) {
    
            if (template[y][x] || Math.random() < 0.2) {
                const noiseOffset = Math.random() > 0.8 ? PIXEL_SIZE : 0;
                ctx.fillRect(
                    (flowerX + x) * PIXEL_SIZE + noiseOffset,
                    (flowerY + y) * PIXEL_SIZE + noiseOffset,
                    PIXEL_SIZE,
                    PIXEL_SIZE
                );
            }
        }
    }
}

function createFlowerCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    return canvas;
}

  let homeCanvas;
  
  onMount(() => {
    isUnmounted = false;

    if (browser && homeCanvas) {
      const ctx = homeCanvas.getContext('2d');
      giveFlower(ctx);
    }
  });

  function regiveFlower() {
    if (isUnmounted || !browser) return;

    if (homeCanvas) {
      const ctx = homeCanvas.getContext('2d');
      giveFlower(ctx);
    }
  }

  onDestroy(() => {
    isUnmounted = true;
    audioPlayers.forEach(sound => sound.stop());
    audioPlayers.clear();
  })

</script>

<div class="sidebar">
  <div class="sidebar-content">
    <a href="/" class="" aria-label="Home">
      <button class="btn-sidebar" on:click={regiveFlower}>
        <canvas
          bind:this={homeCanvas}
          width="40"
          height="40"
          style="width: 40px; height: 40px;"
        />
      </button>
    </a>

    <ASpaceKiss />
    
    {#if $currentUser}
      <div class="users-list">
        {#if loading}
          <div class="loading">
            <div class="loading-icon">
              
            </div>
          </div>
        {:else}
          {#if recentChats.length > 0}
            <div class="users-section">
              {#each recentChats as {user} (user.id)}
                <button 
                  class="user-item"
                  on:click={() => startChat(user.id)}
                >
                  <div class="btn btn-primary btn-circle avatar"
                  style={`background-color: ${user.colour}`}
                  >
                    {#if user.avatar}
                      <img
                        src={getImageURL(user.collectionId, user.id, user.avatar)}
                        alt="you"
                      />
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          {#if newUsers.length > 0}
            <div class="users-section new-connections">
              {#each newUsers as user (user.id)}
                <button 
                  class="user-item"
                  on:click={() => startChat(user.id)}
                >
                  <div class="btn btn-primary btn-circle avatar"
                  style={`background-color: ${user.colour}`}
                  >
                    {#if user.avatar}
                      <img
                        src={getImageURL(user.collectionId, user.id, user.avatar)}
                        alt="you"
                      />
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          {#if recentChats.length === 0 && newUsers.length === 0}
            <!-- nobody -->
          {/if}
        {/if}
      </div>

      <a
        href="/my/settings/profile"
        class="sidebar-item user-profile"
      >
        <div class="btn btn-primary btn-circle avatar"
        style={`background-color: ${$currentUser?.colour}`}
        >
          {#if $currentUser?.avatar}
            
          {/if}
        </div>
      </a>

      
      <form
        method="POST"
        action="/auth/logout"
        on:submit={handleLogout}
        class=""
      >
        <button class="btn-sidebar" aria-label="Logout">
          bye
        </button>
      </form>
    {:else}
      <div>
        <a href="/auth/login" class="btn" aria-label="Log in" title="log me in">
          <button class="btn-sidebar">
            <img src="/plancky007.gif" alt="login"/>
          </button>
        </a>
      </div>
      <div class="">
        <a href="/auth/register" class="btn" aria-label="Register" title="sign me up">
          <button class="btn-sidebar">
            💋
          </button>
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    background-color: var(--cc-bg);
    width: 4rem;
    z-index: 50;
    height: 100%;
    border-right: 1px solid var(--cc-border);
  }

  .sidebar-content {
    height: calc(100vh - 2rem); /* fallback */
    height: calc(100dvh - 2rem);
    display: flex;
    flex-direction: column;
    padding: 1rem 0.5rem;
    gap: 0.5rem;
    align-items: center;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: var(--cc-text);
    text-decoration: none;
    transition: background-color 0.2s;
  }

  /* .sidebar-item:hover {
    background-color: var(--cc-primary-light);
  } */

  .user-profile {
    margin-top: auto;
    margin-bottom: 1rem;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .users-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .users-section {
    padding: 0.5rem 0;
  }

  .users-section.new-connections {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--cc-border);
  }

  .btn-sidebar canvas{
    image-rendering: pixelated;
    border: 2px outset var(--cc-border);
    box-sizing: border-box;
  }
  .btn-sidebar:hover, .btn-sidebar canvas:hover {
    border: 2px inset var(--cc-border) !important;
  }
  .user-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    width: 100%;
    text-align: left;
    background: white;
    border: 2px solid white;
    color: var(--cc-text);
    cursor: pointer;
    box-sizing: border-box;
    /* transition: background-color 0.2s; */
  }

  .user-item:hover {
    /* background-color: #6b6b6b9c; */
    border: 2px inset var(--cc-border) !important;
    
  }

  .avatar {
    width: 1em;
    height: 1em;
  }

  .loading, .no-users {
    text-align: center;
    padding: 1rem;
    color: var(--cc-text-light);
  }
</style> 