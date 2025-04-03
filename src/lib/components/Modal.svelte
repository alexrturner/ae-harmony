<script lang="ts">
  export let label: any
  export let checked: any
</script>

<label for={label}>
  <slot name="trigger" />
</label>

<input type="checkbox" id={label} class="modal-toggle" {checked} />
<label for={label} class="modal">
  <label for="" class="modal-box">
    <div>
      <slot name="heading" />
    </div>
    <div>
      <slot />
    </div>
    <div class="modal-action">
      <slot name="actions" />
    </div>
  </label>
</label>

<style>
  .modal-toggle, .form-control {
    display: none;
  }
</style>
