import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadCache, saveCache, deleteFromCache, STORAGE_KEY } from "../../utils/cache";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe("src/utils/cache.js", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("loadCache", () => {
    it("should retrieve the cached value if it exists", () => {
      const mockCacheData = { key1: "value1", key2: "value2" };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCacheData));

      const result = loadCache();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toEqual(mockCacheData);
    });

    it("should return empty object if the cache does not exist", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadCache();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toEqual({});
    });

    it("should return empty object if localStorage contains invalid JSON", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = loadCache();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toEqual({});
    });

    it("should return empty object if localStorage throws an error", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = loadCache();

      expect(result).toEqual({});
    });
  });

  describe("saveCache", () => {
    it("should store the value in the cache", () => {
      const cacheData = { key1: "value1", key2: "value2" };

      saveCache(cacheData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(cacheData)
      );
    });

    it("should overwrite existing cache values", () => {
      const initialCache = { key1: "oldValue" };
      const newCache = { key1: "newValue", key2: "value2" };

      // First save
      saveCache(initialCache);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(initialCache)
      );

      // Overwrite with new cache
      saveCache(newCache);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(newCache)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });

    it("should handle empty cache object", () => {
      const emptyCache = {};

      saveCache(emptyCache);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(emptyCache)
      );
    });
  });

  describe("deleteFromCache", () => {
    it("should remove the specified cache entry", () => {
      const initialCache = { key1: "value1", key2: "value2", key3: "value3" };
      const expectedCache = { key1: "value1", key3: "value3" };

      // Mock loadCache to return initial cache
      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialCache));

      deleteFromCache("key2");

      // Should load cache first
      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      
      // Should save the updated cache
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(expectedCache)
      );
    });

    it("should do nothing if the cache entry does not exist", () => {
      const initialCache = { key1: "value1", key2: "value2" };

      // Mock loadCache to return initial cache
      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialCache));

      deleteFromCache("nonExistentKey");

      // Should load cache
      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      
      // Should not call setItem since no changes were made
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("should handle empty cache when trying to delete", () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({}));

      deleteFromCache("someKey");

      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("should handle null cache when trying to delete", () => {
      localStorageMock.getItem.mockReturnValue(null);

      deleteFromCache("someKey");

      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
})