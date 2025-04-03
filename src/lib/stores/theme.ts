import { writable } from 'svelte/store';

const storedTheme =
  typeof window !== 'undefined'
    ? localStorage.getItem('selectedTheme') ?? 'light'
    : 'light'

export const selectedTheme = writable(storedTheme);

if (typeof window !== 'undefined') {
  selectedTheme.subscribe((value) => {
    localStorage.setItem('selectedTheme', value);
    // add to document
    document.documentElement.setAttribute('data-theme', value);
  });
}
