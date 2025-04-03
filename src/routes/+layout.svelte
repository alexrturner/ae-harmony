<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte'
  import { currentUser } from '$lib/stores/user'
  import '../styles/main.css'
  import type { PageData } from './$types'
// START VIEW TRANSITIONS API
  import { onNavigate } from '$app/navigation'

  onNavigate((navigation) => {
    // @ts-ignore <-- This is a private API so we need to ignore the TS error
    if (!document.startViewTransition) return

    return new Promise((resolve) => {
      // @ts-ignore <-- This is a private API so we need to ignore the TS error
      document.startViewTransition(async () => {
        resolve()
        await navigation.complete
      })
    })
  })
  // END VIEW TRANSITIONS API

  export let data: PageData

  $: currentUser.set(data.user)
</script>

<div class="layout-container">
  <Sidebar {data} />
  <div class="main-content">
    <slot />
  </div>
</div>
