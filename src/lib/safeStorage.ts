const inMemoryStorage = new Map<string, string>();

let memoryToggle = false;

export const isLocalStorageEnabled = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('hr_local_storage_enabled') === 'true';
    }
  } catch (e) {}
  return memoryToggle;
};

export const setLocalStorageEnabled = (enabled: boolean): void => {
  memoryToggle = enabled;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (enabled) {
        window.localStorage.setItem('hr_local_storage_enabled', 'true');
      } else {
        // Clear all except the enabled flag itself
        window.localStorage.clear();
        window.localStorage.setItem('hr_local_storage_enabled', 'false');
      }
    }
  } catch (e) {
    console.warn("Failed to set localStorage toggle:", e);
  }
};

export const safeStorage = {
  getItem(key: string): string | null {
    if (key === 'hr_local_storage_enabled') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {}
      return memoryToggle ? 'true' : 'false';
    }

    if (isLocalStorageEnabled()) {
      try {
        return window.localStorage ? window.localStorage.getItem(key) : null;
      } catch (e) {
        console.warn(`localStorage.getItem failed for key "${key}":`, e);
        return inMemoryStorage.get(key) || null;
      }
    }
    // Return from memory if local storage is disabled
    return inMemoryStorage.get(key) || null;
  },
  setItem(key: string, value: string): void {
    if (key === 'hr_local_storage_enabled') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {}
      memoryToggle = value === 'true';
      return;
    }

    if (isLocalStorageEnabled()) {
      try {
        if (window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn(`localStorage.setItem failed for key "${key}":`, e);
        inMemoryStorage.set(key, value);
      }
    } else {
      inMemoryStorage.set(key, value);
    }
  },
  removeItem(key: string): void {
    if (key === 'hr_local_storage_enabled') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {}
      memoryToggle = false;
      return;
    }

    if (isLocalStorageEnabled()) {
      try {
        if (window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn(`localStorage.removeItem failed for key "${key}":`, e);
        inMemoryStorage.delete(key);
      }
    } else {
      inMemoryStorage.delete(key);
    }
  },
  clear(): void {
    if (isLocalStorageEnabled()) {
      try {
        if (window.localStorage) {
          window.localStorage.clear();
          // Restore the toggle state
          window.localStorage.setItem('hr_local_storage_enabled', 'true');
        }
      } catch (e) {
        console.warn("localStorage.clear failed:", e);
        inMemoryStorage.clear();
      }
    } else {
      inMemoryStorage.clear();
    }
  }
};

