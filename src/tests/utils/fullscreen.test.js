import { describe, it, expect, beforeEach, vi } from "vitest";
import { enterFullscreen, exitFullscreen } from "../../utils/fullscreen";

describe("src/utils/fullscreen.js", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Clear any existing fullscreen methods on documentElement
    delete document.documentElement.requestFullscreen;
    delete document.documentElement.mozRequestFullScreen;
    delete document.documentElement.webkitRequestFullscreen;
    delete document.documentElement.msRequestFullscreen;
    
    // Clear any existing fullscreen methods on document
    delete document.exitFullscreen;
    delete document.mozCancelFullScreen;
    delete document.webkitExitFullscreen;
    delete document.msExitFullscreen;
  });

  describe("enterFullscreen", () => {
    it("should call requestFullscreen when available", () => {
      const mockRequestFullscreen = vi.fn();
      document.documentElement.requestFullscreen = mockRequestFullscreen;

      enterFullscreen();

      expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it("should call mozRequestFullScreen when requestFullscreen is not available", () => {
      const mockMozRequestFullScreen = vi.fn();
      document.documentElement.requestFullscreen = undefined;
      document.documentElement.mozRequestFullScreen = mockMozRequestFullScreen;

      enterFullscreen();

      expect(mockMozRequestFullScreen).toHaveBeenCalledTimes(1);
    });

    it("should call webkitRequestFullscreen when standard and moz methods are not available", () => {
      const mockWebkitRequestFullscreen = vi.fn();
      document.documentElement.requestFullscreen = undefined;
      document.documentElement.mozRequestFullScreen = undefined;
      document.documentElement.webkitRequestFullscreen = mockWebkitRequestFullscreen;

      enterFullscreen();

      expect(mockWebkitRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it("should call msRequestFullscreen when other methods are not available", () => {
      const mockMsRequestFullscreen = vi.fn();
      document.documentElement.requestFullscreen = undefined;
      document.documentElement.mozRequestFullScreen = undefined;
      document.documentElement.webkitRequestFullscreen = undefined;
      document.documentElement.msRequestFullscreen = mockMsRequestFullscreen;

      enterFullscreen();

      expect(mockMsRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it("should handle case when no fullscreen methods are available", () => {
      document.documentElement.requestFullscreen = undefined;
      document.documentElement.mozRequestFullScreen = undefined;
      document.documentElement.webkitRequestFullscreen = undefined;
      document.documentElement.msRequestFullscreen = undefined;

      // Should not throw an error
      expect(() => enterFullscreen()).not.toThrow();
    });

    it("should prioritize standard method over vendor-specific ones", () => {
      const mockRequestFullscreen = vi.fn();
      const mockMozRequestFullScreen = vi.fn();
      const mockWebkitRequestFullscreen = vi.fn();
      
      document.documentElement.requestFullscreen = mockRequestFullscreen;
      document.documentElement.mozRequestFullScreen = mockMozRequestFullScreen;
      document.documentElement.webkitRequestFullscreen = mockWebkitRequestFullscreen;

      enterFullscreen();

      expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
      expect(mockMozRequestFullScreen).not.toHaveBeenCalled();
      expect(mockWebkitRequestFullscreen).not.toHaveBeenCalled();
    });
  });

  describe("exitFullscreen", () => {
    it("should call exitFullscreen when available", () => {
      const mockExitFullscreen = vi.fn();
      document.exitFullscreen = mockExitFullscreen;

      exitFullscreen();

      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it("should call mozCancelFullScreen when exitFullscreen is not available", () => {
      const mockMozCancelFullScreen = vi.fn();
      document.exitFullscreen = undefined;
      document.mozCancelFullScreen = mockMozCancelFullScreen;

      exitFullscreen();

      expect(mockMozCancelFullScreen).toHaveBeenCalledTimes(1);
    });

    it("should call webkitExitFullscreen when standard and moz methods are not available", () => {
      const mockWebkitExitFullscreen = vi.fn();
      document.exitFullscreen = undefined;
      document.mozCancelFullScreen = undefined;
      document.webkitExitFullscreen = mockWebkitExitFullscreen;

      exitFullscreen();

      expect(mockWebkitExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it("should call msExitFullscreen when other methods are not available", () => {
      const mockMsExitFullscreen = vi.fn();
      document.exitFullscreen = undefined;
      document.mozCancelFullScreen = undefined;
      document.webkitExitFullscreen = undefined;
      document.msExitFullscreen = mockMsExitFullscreen;

      exitFullscreen();

      expect(mockMsExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it("should handle case when no exit fullscreen methods are available", () => {
      document.exitFullscreen = undefined;
      document.mozCancelFullScreen = undefined;
      document.webkitExitFullscreen = undefined;
      document.msExitFullscreen = undefined;

      // Should not throw an error
      expect(() => exitFullscreen()).not.toThrow();
    });

    it("should prioritize standard method over vendor-specific ones", () => {
      const mockExitFullscreen = vi.fn();
      const mockMozCancelFullScreen = vi.fn();
      const mockWebkitExitFullscreen = vi.fn();
      
      document.exitFullscreen = mockExitFullscreen;
      document.mozCancelFullScreen = mockMozCancelFullScreen;
      document.webkitExitFullscreen = mockWebkitExitFullscreen;

      exitFullscreen();

      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
      expect(mockMozCancelFullScreen).not.toHaveBeenCalled();
      expect(mockWebkitExitFullscreen).not.toHaveBeenCalled();
    });
  });
});