const DB_NAME = 'delivery-app';
const STORE_NAME = 'kv';
const memoryStore = new Map();
let dbPromise = null;
let initialized = false;
let originals = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function getDbEntries() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    const valuesRequest = store.getAll();
    tx.oncomplete = () => {
      const keys = request.result || [];
      const values = valuesRequest.result || [];
      resolve(keys.map((key, index) => [String(key), values[index]]));
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function setDbValue(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeDbValue(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearDb() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function installBridge() {
  if (originals) return;
  originals = {
    getItem: window.localStorage.getItem.bind(window.localStorage),
    setItem: window.localStorage.setItem.bind(window.localStorage),
    removeItem: window.localStorage.removeItem.bind(window.localStorage),
    clear: window.localStorage.clear.bind(window.localStorage),
    key: window.localStorage.key.bind(window.localStorage),
  };

  window.localStorage.getItem = (key) => {
    const normalizedKey = String(key);
    return memoryStore.has(normalizedKey) ? memoryStore.get(normalizedKey) : null;
  };

  window.localStorage.setItem = (key, value) => {
    const normalizedKey = String(key);
    const normalizedValue = String(value);
    memoryStore.set(normalizedKey, normalizedValue);
    void setDbValue(normalizedKey, normalizedValue);
  };

  window.localStorage.removeItem = (key) => {
    const normalizedKey = String(key);
    memoryStore.delete(normalizedKey);
    void removeDbValue(normalizedKey);
  };

  window.localStorage.clear = () => {
    memoryStore.clear();
    void clearDb();
  };

  window.localStorage.key = (index) => Array.from(memoryStore.keys())[index] || null;
}

export async function initIndexedDbLocalStorageBridge() {
  if (initialized || typeof window === 'undefined' || !window.indexedDB || !window.localStorage) {
    initialized = true;
    return;
  }

  const legacyKeys = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key) {
      legacyKeys.push([key, window.localStorage.getItem(key)]);
    }
  }

  const dbEntries = await getDbEntries();
  if (!dbEntries.length && legacyKeys.length) {
    await Promise.all(legacyKeys.map(([key, value]) => setDbValue(key, value)));
    dbEntries.push(...legacyKeys);
  }

  dbEntries.forEach(([key, value]) => {
    memoryStore.set(String(key), value == null ? null : String(value));
  });

  installBridge();
  initialized = true;
}

export function listPersistentKeysSync() {
  return Array.from(memoryStore.keys());
}