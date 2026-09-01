import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Node 25+ defines an experimental global Web Storage accessor. Without
// --localstorage-file that accessor can resolve to undefined and shadow the
// fully functional JSDOM storage used by browser tests. Always bind the test
// globals to JSDOM so results do not depend on the host Node configuration.
if (typeof window !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: window.localStorage
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: window.sessionStorage
  });
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
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
