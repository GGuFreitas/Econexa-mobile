export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

class MemoryCache implements Cache {
  private store = new Map<string, { value: unknown; expires?: number }>();

  async get<T>(key: string): Promise<T | undefined> {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (item.expires && item.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return item.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const cache: Cache = new MemoryCache();
