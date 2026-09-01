import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(String(key)) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(String(key));
  }

  setItem(key: string, value: string) {
    this.values.set(String(key), String(value));
  }
}

// Node 25+ defines an experimental Web Storage accessor that can resolve to
// undefined when no --localstorage-file is configured. Tests use isolated
// in-memory implementations instead of depending on the host runtime.
const testLocalStorage = new MemoryStorage();
const testSessionStorage = new MemoryStorage();

for (const [name, value] of [
  ['localStorage', testLocalStorage],
  ['sessionStorage', testSessionStorage]
] as const) {
  Object.defineProperty(globalThis, name, { configurable: true, value });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, name, { configurable: true, value });
  }
}

afterEach(() => {
  testLocalStorage.clear();
  testSessionStorage.clear();
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
