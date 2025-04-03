<script lang="ts">
  export let value = ''
  export let placeholder = ''
  export let id: any
  export let type = 'text'
  export let disabled = false
  export let required = false
  export let errors: any
  export let autoFocus = false
</script>

<div class="form-control">
  <input
    class={type === 'file'
      ? 'file-input'
      : 'input'}
    {type}
    {placeholder}
    {required}
    {disabled}
    {id}
    name={id}
    {value}
    autofocus={autoFocus ? true : false}
  />
  {#if errors}
    {#each errors as error}
      <label style="display: none;" for={id}>
        <span class="label-text-alt text-error">
          {error}
        </span>
      </label>
    {/each}
  {/if}
</div>
