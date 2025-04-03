<script lang="ts">
  import { applyAction, enhance } from '$app/forms'
  import Input from '$lib/components/Input.svelte'
  export let form
  let loading = false
</script>

<div class="form-container">
<form
  action="?/register"
  method="POST"
  enctype="multipart/form-data"
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

    <Input
      autoFocus={false}
      type="password"
      id="passwordConfirm"
      value={form?.data?.password ?? ''}
      errors={form?.errors?.password}
      disabled={loading}
      placeholder={'password'}
    />

    <div class="form-control">
      <label for="colour" class="label">
        
      </label>
      <div>
        <input
          type="color"
          name="colour"
          id="colour"
          value={form?.data?.colour ?? "#000000"}
          disabled={loading}
        />
        <span class="text-sm">{form?.data?.colour ?? ""}</span>
      </div>
    </div>

    <div class="form-control">
      <label for="sound" class="label">
        <span class="label-text">a kissing sound</span>
      </label>
      <input
        style="display: none;"
        type="file"
        name="sound"
        id="sound"
        accept="audio/*"
        class="file-input file-input-bordered w-full"
        disabled={loading}
      />
    </div>

    <button class="btn btn-primary">
      {#if loading}
      
      {:else}
        &lt; 3
      {/if}
    </button>
  </div>
</form>
</div>