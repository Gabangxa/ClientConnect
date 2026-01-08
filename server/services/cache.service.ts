import { db } from "../db";
import { appCache } from "@shared/schema";
import { eq, lt } from "drizzle-orm";

export class CacheService {
  private static instance: CacheService;

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get a value from the cache.
   * Returns null if key doesn't exist or is expired.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await db
        .select()
        .from(appCache)
        .where(eq(appCache.key, key))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const entry = result[0];
      if (new Date() > entry.expiresAt) {
        // Delete expired entry asynchronously
        this.delete(key).catch(console.error);
        return null;
      }

      return entry.value as T;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null; // Fail safe to null (cache miss)
    }
  }

  /**
   * Set a value in the cache.
   * @param ttlSeconds Time to live in seconds (default 5 minutes)
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await db
        .insert(appCache)
        .values({
          key,
          value,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: appCache.key,
          set: {
            value,
            expiresAt,
            createdAt: new Date(),
          },
        });
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
    }
  }

  /**
   * Delete a value from the cache.
   */
  async delete(key: string): Promise<void> {
    try {
      await db.delete(appCache).where(eq(appCache.key, key));
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
    }
  }
}

export const cacheService = CacheService.getInstance();
