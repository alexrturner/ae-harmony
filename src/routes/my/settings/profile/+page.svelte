<script lang="ts">
  import { applyAction, enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import Toast from '$lib/components/Toast.svelte'
  import { toast } from '$lib/stores/toast'
  import { getImageURL } from '$lib/utils'

  export let data
  export let form
  let loading: any

  $: loading = false
  const showPreview = (event: any) => {
    const target = event.target
    const files = target.files

    if (files.length > 0) {
      const src = URL.createObjectURL(files[0])
      const preview = document.getElementById(
        'avatar-preview',
      ) as HTMLImageElement
      if (preview) {
        preview.src = src
      }
    }
  }

  let audioPreview: HTMLAudioElement;
  let soundDuration = 0;

  // Add this function to check audio duration
  const checkAudioDuration = (event: any) => {
    const target = event.target;
    const files = target.files;

    if (files.length > 0) {
      const file = files[0];
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        if (audio.duration > 3) {
          toast.set({
            show: true,
            message: 'Sound must be 3 seconds or shorter',
            type: 'error',
          });
          target.value = '';
          if (audioPreview) {
            audioPreview.src = '';
          }
        } else {
          soundDuration = audio.duration;
          if (audioPreview) {
            audioPreview.src = audio.src;
          }
        }
      };
    }
  };

  const submitUpdateProfile = () => {
    loading = true
    return async ({ result }: any) => {
      switch (result.type) {
        case 'success':
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
    }
  }

  function copyToClipboard(content: string) {
    navigator.clipboard.writeText(content).then(
      () => {
        toast.set({
          show: true,
          message: 'Message copied to clipboard',
          type: 'success',
        })
        setTimeout(
          () => toast.set({ show: false, message: '', type: '' }),
          2000,
        )
      },
      (err) => console.error('Could not copy text: ', err),
    )
  }
</script>

<div class="flex">
  <form
    action="?/updateProfile"
    method="POST"
    class="flex"
    enctype="multipart/form-data"
    use:enhance={submitUpdateProfile}
  >
    
    <div class="divider" />
    <div class="form-control">
      

    <div class="form-control">
      
      <div class="flex">
        <input
          type="color"
          name="colour"
          id="colour"
          class="w-12 h-12 rounded cursor-pointer"
          value={form?.data?.colour ?? data?.user?.colour ?? "#000000"}
          disabled={loading}
        />
        <span class="text-sm">{form?.data?.colour ?? data?.user?.colour ?? "#000000"}</span>
      </div>
    </div>

    <div class="form-control w-full max-w-lg">
      <label for="sound" class="label btn">
        <span class="label-text">a kissing sound</span>
      </label>
      <input
        style="display: none;"
        type="file"
        name="sound"
        id="sound"
        accept="audio/*"
        class="file-input file-input-bordered w-full"
        on:change={checkAudioDuration}
        disabled={loading}
      />
      {#if data?.user?.sound}
        <div class="mt-2">
          <audio
            bind:this={audioPreview}
            controls
            src={getImageURL(data.user.collectionId, data.user.id, data.user.sound)}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      {/if}
    </div>

    <!-- <Input
      id="name"
      value={form?.data?.name ?? data?.user?.name}
      disabled={loading}
      errors={form?.errors?.name}
      placeholder="Name"
    /> -->


    <div class="w-full max-w-lg pt-3">
      <button
        class="btn btn-primary w-full max-w-lg"
        type="submit"
        disabled={loading}
      >
        save
      </button>
    </div>
  </form>
</div>

<Toast type={$toast.type} message={$toast.message} show={$toast.show} />
