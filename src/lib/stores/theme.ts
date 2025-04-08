import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const storedTheme = browser 
  ? localStorage.getItem('selectedTheme') ?? 'light'
  : 'light'

export const selectedTheme = writable(storedTheme);

if (browser) {
  selectedTheme.subscribe((value) => {
    localStorage.setItem('selectedTheme', value);
    // add to document
    document.documentElement.setAttribute('data-theme', value);
  });
}
