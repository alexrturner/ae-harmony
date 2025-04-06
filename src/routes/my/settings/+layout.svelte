<script lang="ts">
  import { page } from '$app/stores'
  const navigation = [
    {
      title: 'Profile',
      href: '/my/settings/profile',
    },
    {
      title: 'Account',
      href: '/my/settings/account',
    },
    {
      title: 'Security',
      href: '/my/settings/security',
    },
  ]
</script>

<div class="settings">
  <div class="divider" />
  <div class="content-wrapper">
    <ul class="nav-menu">
      {#each navigation as navItem}
        <li>
          <a
            href={navItem.href}
            class="{$page.url.pathname === navItem.href
              ? 'active'
              : ''}">{navItem.title}</a
          >
        </li>
      {/each}
    </ul>
    <div class="content">
      <slot />
    </div>
  </div>
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    min-height: 100dvh;
  }

  .content-wrapper {
    display: flex;
    gap: 2rem;
  }

  .nav-menu {
    width: 120px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .nav-menu li {
    margin-bottom: 2rem;
  }

  .nav-menu a {
    text-decoration: none;
    color: inherit;
  }

  .nav-menu a.active {
    font-weight: bold;
  }

  .content {
    min-width: 400px;
  }
</style>