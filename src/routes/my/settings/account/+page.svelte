<script lang="ts">
  import { applyAction, enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import Input from '$lib/components/Input.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import Toast from '$lib/components/Toast.svelte'
  import { toast } from '$lib/stores/toast'

  export let form
  export let data
  let emailModalOpen: any
  let usernameModalOpen: any
  let loading: any

  $: emailModalOpen = false
  $: usernameModalOpen = false
  $: loading = false

  const submitUpdateEmail = () => {
    loading = true
    emailModalOpen = true
    return async ({ result }: any) => {
      switch (result.type) {
        case 'success':
          await invalidateAll()
          toast.set({
            show: true,
            message: 'Email updated successfully',
            type: 'success',
          })
          setTimeout(
            () => toast.set({ show: false, message: '', type: '' }),
            2000,
          )
          break
        case 'error':
          await invalidateAll()
          toast.set({
            show: true,
            message: 'Email update failed',
            type: 'error',
          })
          setTimeout(
            () => toast.set({ show: false, message: '', type: '' }),
            2000,
          )
          break
        default:
          await applyAction(result)
      }
      emailModalOpen = false
      loading = false
    }
  }

  const submitUpdateUsername = () => {
    loading = true
    usernameModalOpen = true
    return async ({ result }: any) => {
      switch (result.type) {
        case 'success':
          await invalidateAll()
          toast.set({
            show: true,
            message: 'Profile updated successfully',
            type: 'success',
          })
          setTimeout(
            () => toast.set({ show: false, message: '', type: '' }),
            2000,
          )
          await invalidateAll()
          break
        case 'error':
          toast.set({
            show: true,
            message: 'Profile update failed',
            type: 'error',
          })
          setTimeout(
            () => toast.set({ show: false, message: '', type: '' }),
            2000,
          )
          break
        default:
          await applyAction(result)
      }
      loading = false
      usernameModalOpen = false
    }
  }
</script>

<div class="flex col2">
  <div>
    <Input
      id="email"
      value={data?.user?.email}
      disabled={true}
      errors={form?.errors?.email}
    />

    <Modal label="change-email" checked={emailModalOpen}>
      <span slot="trigger" class="btn btn-primary">change email</span>
      <!-- <div slot="heading">Change Email</div> -->
      <form
        action="?/updateEmail"
        method="POST"
        use:enhance={submitUpdateEmail}
      >
        <Input
          id="email"
          type="email"
          required={true}
          value={form?.data?.email}
          disabled={loading}
          errors={form?.errors?.email}
        />
        <button type="submit" class="btn btn-primary w-full" disabled={loading}
          >Save</button
        >
      </form>
    </Modal>
  </div>
  <div>
    
    <Input
      id="username"
      value={data?.user?.username}
      disabled={true}
      errors={form?.errors?.username}
    />
    <Modal label="change-username" checked={usernameModalOpen}>
     
      <div slot="heading">change name</div>
      <form
        action="?/updateUsername"
        method="POST"
        class=""
        use:enhance={submitUpdateUsername}
      >
        <Input
          id="username"
          type="text"
          required={true}
          value={form?.data?.username}
          errors={form?.errors?.username}
          disabled={loading}
        />
        <button type="submit" class="btn btn-primary" disabled={loading}>
          save
          </button
        >
      </form>
    </Modal>
  </div>
</div>

<Toast type={$toast.type} message={$toast.message} show={$toast.show} />

<style>
  .modal-toggle, .form-control {
    display: none;
  }
  .col2 {
    gap: 1rem;
    align-items: flex-start;

  }
  .col2 > div {
    border: 1px outset black;
    margin-bottom: 1rem;
    padding: 0 0.5rem;
  }
</style>