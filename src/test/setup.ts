import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// jsdom under Vitest 4 doesn't always expose a working localStorage.
// Provide a minimal in-memory shim so zustand's persist middleware works.
class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const memLocal = new MemoryStorage();
const memSession = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: memLocal,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: memSession,
});

beforeEach(() => {
  memLocal.clear();
  memSession.clear();
});
