type StoredValue = unknown;

const databaseName = 'sheetly-offline-sync';
const databaseVersion = 1;
const storeName = 'keyValue';

const memoryStore = new Map<string, StoredValue>();

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
      }
    };
  });
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export const indexedDbService = {
  async clear(): Promise<void> {
    if (!hasIndexedDb()) {
      memoryStore.clear();
      return;
    }

    await runTransaction('readwrite', (store) => store.clear());
  },
  async get<T>(key: string): Promise<T | null> {
    if (!hasIndexedDb()) {
      return (memoryStore.get(key) as T | undefined) ?? null;
    }

    return ((await runTransaction('readonly', (store) => store.get(key))) as T | undefined) ?? null;
  },
  async remove(key: string): Promise<void> {
    if (!hasIndexedDb()) {
      memoryStore.delete(key);
      return;
    }

    await runTransaction('readwrite', (store) => store.delete(key));
  },
  async set<T>(key: string, value: T): Promise<void> {
    if (!hasIndexedDb()) {
      memoryStore.set(key, value);
      return;
    }

    await runTransaction('readwrite', (store) => store.put(value, key));
  },
};
