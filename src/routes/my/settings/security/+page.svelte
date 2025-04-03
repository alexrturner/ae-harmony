<script lang="ts">
  import Input from '$lib/components/Input.svelte'
  export let form
</script>

<div class="flex flex-col w-full h-full">
  <div class="box">
    <form
      action="?/updatePassword"
      method="POST"
      class="flex flex-col space-y-2 w-full"
    >
      <div class="text-2xl">change password</div>
      <div class="divider" />
      <Input
        id="oldPassword"
        type="password"
        required
        errors={form?.errors?.oldPassword}
        placeholder="password"
      />
      <Input
        id="password"
        type="password"
        required
        errors={form?.errors?.password}
        placeholder="new password"
      />
      <Input
        id="passwordConfirm"
        type="password"
        required
        errors={form?.errors?.passwordConfirm}
        placeholder="new password again"
      />
      
      <div class="w-full max-w-lg pt-2">
        <button type="submit" class="btn btn-primary">
          save
        </button>
      </div>
    </form>
  </div>
</div>

<style> 
  .box {
    border: 1px outset black;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}
</style>