import { browser } from '$app/environment'
import { pb } from '$lib/pocketbase'
import { currentUser } from '$lib/stores/user'

// This is a client-side hook that loads the user's authentication state from the cookie and sets the current user in the store.
if (browser) {
  pb.authStore.loadFromCookie(document.cookie)
  pb.authStore.onChange(() => {
    currentUser.set(pb.authStore.model)
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false })
  }, true)
}
