import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Node 25+ can provide its own persistent Web Storage implementation when
// --localstorage-file is enabled. Clear whichever implementation is active so
// test files cannot leak browser state into one another.
afterEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

// Polyfills and mocks for JSDOM
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}
