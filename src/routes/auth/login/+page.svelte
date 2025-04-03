<script lang="ts">
  import { applyAction, enhance } from '$app/forms'
  import Input from '$lib/components/Input.svelte'
  export let form;
  let loading = false
  import Icon from '@iconify/svelte'
</script>

<div class="form-container">
<form
  action="?/login"
  method="POST"
  class="card"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'redirect') {
        loading = true
        await applyAction(result)
      } else {
        await applyAction(result)
      }
    }
  }}
>
 

  <div class="form-control">
    <Input
      autoFocus={true}
      type="email"
      id="email"
      value={form?.data?.email ?? ''}
      errors={form?.errors?.email}
      placeholder={'email'}
    />
    <Input
      autoFocus={false}
      type="password"
      id="password"
      value={form?.data?.password ?? ''}
      errors={form?.errors?.password}
      disabled={loading}
      placeholder={'password'}
    />

    <button class="btn btn-primary group/loginButton mt-2">
      {#if loading}
        <span class="loading loading-spinner loading-md"></span>
      {:else}
        &lt; 3
      {/if}
    </button>
  </div>
</form>
</div>