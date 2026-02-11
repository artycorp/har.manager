import { vi } from 'vitest'

// Mock crypto.randomUUID for consistent test results
if (!globalThis.crypto) {
  globalThis.crypto = {}
}
if (!globalThis.crypto.randomUUID) {
  let counter = 0
  globalThis.crypto.randomUUID = () => {
    counter++
    return `00000000-0000-0000-0000-${String(counter).padStart(12, '0')}`
  }
}

// Mock navigator.clipboard (use defineProperty since happy-dom makes it read-only)
const clipboardMock = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue(''),
}
try {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboardMock,
    writable: true,
    configurable: true,
  })
} catch {
  if (!globalThis.navigator) {
    globalThis.navigator = {}
  }
  globalThis.navigator.clipboard = clipboardMock
}

// Provide a proper localStorage mock (happy-dom's may not expose standard API)
const storage = new Map()
const localStorageMock = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
  get length() { return storage.size },
  key: (index) => [...storage.keys()][index] ?? null,
}
try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  })
} catch {
  globalThis.localStorage = localStorageMock
}
