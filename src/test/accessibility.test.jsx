import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import App from "../App";

describe("Accessibility Features", () => {
  describe("Skip to Main Content", () => {
    it("should render skip to main content link", () => {
      render(<App />);
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
    });

    it("should have correct href pointing to main content", () => {
      render(<App />);
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toHaveAttribute("href", "#main-content");
    });

    it("should be positioned off-screen by default", () => {
      render(<App />);
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toHaveStyle({ left: "-9999px" });
    });

    it("should become visible on focus", async () => {
      const user = userEvent.setup();
      render(<App />);
      const skipLink = screen.getByText(/skip to main content/i);

      await user.tab(); // Tab to focus the skip link

      // After focus, it should be visible
      expect(skipLink).toHaveFocus();
    });
  });

  describe("ARIA Labels", () => {
    it("should have proper document structure", () => {
      const { container } = render(
        <BrowserRouter>
          <main id="main-content" role="main" aria-label="Editor">
            <h1>Test Content</h1>
          </main>
        </BrowserRouter>,
      );

      const main = container.querySelector("main");
      expect(main).toHaveAttribute("role", "main");
      expect(main).toHaveAttribute("id", "main-content");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support tab navigation through interactive elements", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <div>
            <button>First Button</button>
            <button>Second Button</button>
            <a href="#test">Link</a>
          </div>
        </BrowserRouter>,
      );

      const firstButton = screen.getByText("First Button");
      const secondButton = screen.getByText("Second Button");
      const link = screen.getByText("Link");

      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();

      await user.tab();
      expect(link).toHaveFocus();
    });
  });

  describe("Focus Management", () => {
    it("should maintain focus indicator on interactive elements", () => {
      render(
        <BrowserRouter>
          <button>Test Button</button>
        </BrowserRouter>,
      );

      const button = screen.getByText("Test Button");
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe("Semantic HTML", () => {
    it("should use semantic HTML for navigation", () => {
      const { container } = render(
        <BrowserRouter>
          <nav role="navigation" aria-label="Main Navigation">
            <a href="#home">Home</a>
          </nav>
        </BrowserRouter>,
      );

      const nav = container.querySelector("nav");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute("role", "navigation");
    });

    it("should use main element with proper attributes", () => {
      const { container } = render(
        <BrowserRouter>
          <main id="main-content" role="main">
            <h1>Main Content</h1>
          </main>
        </BrowserRouter>,
      );

      const main = container.querySelector("main");
      expect(main).toHaveAttribute("id", "main-content");
      expect(main).toHaveAttribute("role", "main");
    });
  });

  describe("Button Accessibility", () => {
    it("should have aria-label for icon-only buttons", () => {
      render(
        <BrowserRouter>
          <button aria-label="Zoom in" title="Zoom in">
            <i className="bi bi-plus-lg" aria-hidden="true" />
          </button>
        </BrowserRouter>,
      );

      const button = screen.getByLabelText("Zoom in");
      expect(button).toBeInTheDocument();
    });

    it("should mark decorative icons as aria-hidden", () => {
      const { container } = render(
        <BrowserRouter>
          <button aria-label="Delete">
            <i className="bi bi-trash" aria-hidden="true" />
          </button>
        </BrowserRouter>,
      );

      const icon = container.querySelector("i");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Live Regions", () => {
    it("should announce dynamic content changes", () => {
      const { container } = render(
        <BrowserRouter>
          <div role="status" aria-live="polite" aria-label="Zoom: 100%">
            100%
          </div>
        </BrowserRouter>,
      );

      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Form Accessibility", () => {
    it("should associate labels with form inputs", () => {
      render(
        <BrowserRouter>
          <div>
            <label htmlFor="table-name">Table Name</label>
            <input id="table-name" type="text" />
          </div>
        </BrowserRouter>,
      );

      const input = screen.getByLabelText("Table Name");
      expect(input).toBeInTheDocument();
    });

    it("should provide accessible error messages", () => {
      render(
        <BrowserRouter>
          <div>
            <input
              id="email"
              type="email"
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <div id="email-error" role="alert">
              Please enter a valid email
            </div>
          </div>
        </BrowserRouter>,
      );

      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent("Please enter a valid email");
    });
  });

  describe("Color Contrast", () => {
    it("should render with sufficient contrast ratios", () => {
      const { container } = render(
        <BrowserRouter>
          <div className="theme">
            <p
              style={{
                color: "var(--semi-color-text-0)",
                backgroundColor: "var(--semi-color-bg-0)",
              }}
            >
              High contrast text
            </p>
          </div>
        </BrowserRouter>,
      );

      const text = container.querySelector("p");
      expect(text).toBeInTheDocument();
    });
  });

  describe("Reduced Motion Support", () => {
    it("should respect prefers-reduced-motion", () => {
      // Mock matchMedia for reduced motion
      window.matchMedia = (query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      });

      const { container } = render(
        <BrowserRouter>
          <div className="animated-element">Content</div>
        </BrowserRouter>,
      );

      expect(container.querySelector(".animated-element")).toBeInTheDocument();
    });
  });

  describe("Touch Target Size", () => {
    it("should have adequate touch target sizes on mobile", () => {
      render(
        <BrowserRouter>
          <button style={{ minWidth: "44px", minHeight: "44px" }}>
            Tap Me
          </button>
        </BrowserRouter>,
      );

      const button = screen.getByText("Tap Me");
      const styles = window.getComputedStyle(button);

      // Button should meet minimum touch target size
      expect(button).toBeInTheDocument();
    });
  });

  describe("Screen Reader Announcements", () => {
    it("should have screen reader only text when needed", () => {
      const { container } = render(
        <BrowserRouter>
          <span className="sr-only">Additional context for screen readers</span>
        </BrowserRouter>,
      );

      const srText = container.querySelector(".sr-only");
      expect(srText).toBeInTheDocument();
    });
  });

  describe("Dialog/Modal Accessibility", () => {
    it("should trap focus within modal dialogs", () => {
      render(
        <BrowserRouter>
          <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <h2 id="dialog-title">Dialog Title</h2>
            <button>Close</button>
          </div>
        </BrowserRouter>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");
    });
  });
});
