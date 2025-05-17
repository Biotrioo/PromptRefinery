export async function getIndexedDbStorage() {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return undefined; // Or fallback to localStorage adapter
  }
  const { openDB } = await import('idb');
  const DB_NAME = 'prompt-refinery';
  const STORE_NAME = 'keyval';
  const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db: any) {
      db.createObjectStore(STORE_NAME);
    },
  });
  return {
    async getItem(name: string) {
      return (await dbPromise).get(STORE_NAME, name);
    },
    async setItem(name: string, value: any) {
      return (await dbPromise).put(STORE_NAME, value, name);
    },
    async removeItem(name: string) {
      return (await dbPromise).delete(STORE_NAME, name);
    },
  };
} 