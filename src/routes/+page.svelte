<script lang="ts">
  import ChatConstellation from '$lib/components/ChatConstellation.svelte'
  import type { PageData } from './$types'

  export let data: PageData
</script>


<ChatConstellation initialChats={data.chats} />

