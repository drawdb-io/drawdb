import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectLanguageByLocation,
  locationBasedLanguageDetector,
} from "../i18n/utils/locationLanguageDetector";

describe("Location Language Detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("detectLanguageByLocation", () => {
    it("should detect language from US IP", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "US" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("en");
    });

    it("should detect language from Spain IP", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "ES" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("es");
    });

    it("should detect language from India with regional specificity", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "IN", region_code: "MH" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("mr"); // Marathi for Maharashtra
    });

    it("should detect language from India with Gujarat region", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "IN", region_code: "GJ" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("gu"); // Gujarati
    });

    it("should detect language from France", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "FR" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("fr");
    });

    it("should detect language from Japan", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "JP" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("jp");
    });

    it("should detect language from China", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "CN" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("zh");
    });

    it("should detect language from Taiwan", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "TW" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("zh-TW");
    });

    it("should fall back to browser language when geolocation fails", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      // Mock navigator.language
      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "es-ES",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("es");
    });

    it("should default to English when country not in map", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "ZZ" }), // Non-existent country
      });

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "en-US",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("en");
    });

    it("should handle timeout gracefully", async () => {
      global.fetch = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () => resolve({ ok: true, json: async () => ({}) }),
                5000,
              ),
            ),
        );

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "en-US",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("en");
    });

    it("should use fallback API when primary fails", async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Primary API failed"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ country: "DE" }),
        });

      const language = await detectLanguageByLocation();
      expect(language).toBe("de");
    });

    it("should handle Arabic-speaking countries", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "SA" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("ar");
    });

    it("should handle Portuguese from Brazil", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "BR" }),
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("pt-BR");
    });
  });

  describe("locationBasedLanguageDetector", () => {
    it("should return saved language from localStorage", async () => {
      localStorage.getItem.mockReturnValue("fr");

      const promise = new Promise((resolve) => {
        locationBasedLanguageDetector.detect((language) => {
          expect(language).toBe("fr");
          expect(localStorage.getItem).toHaveBeenCalledWith("i18nextLng");
          resolve();
        });
      });

      await promise;
    });

    it("should detect language when no saved preference exists", async () => {
      localStorage.getItem.mockReturnValue(null);
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "IT" }),
      });

      const promise = new Promise((resolve) => {
        locationBasedLanguageDetector.detect((language) => {
          expect(language).toBe("it");
          resolve();
        });
      });

      await promise;
    });

    it("should cache user language preference", () => {
      locationBasedLanguageDetector.cacheUserLanguage("de");
      expect(localStorage.setItem).toHaveBeenCalledWith("i18nextLng", "de");
    });

    it("should have correct type", () => {
      expect(locationBasedLanguageDetector.type).toBe("languageDetector");
    });

    it("should have async detection", () => {
      expect(locationBasedLanguageDetector.async).toBe(true);
    });
  });

  describe("Browser Language Mapping", () => {
    it("should map Hindi browser language", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("No geolocation"));

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "hi-IN",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("hi");
    });

    it("should map Traditional Chinese", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("No geolocation"));

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "zh-TW",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("zh-TW");
    });

    it("should map Korean browser language", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("No geolocation"));

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "ko-KR",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("ko");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty response from API", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "en-US",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("en");
    });

    it("should handle malformed API response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "data" }),
      });

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: "fr-FR",
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("fr");
    });

    it("should handle no navigator.language", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("No geolocation"));

      Object.defineProperty(window.navigator, "language", {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const language = await detectLanguageByLocation();
      expect(language).toBe("en"); // Should default to English
    });
  });
});
