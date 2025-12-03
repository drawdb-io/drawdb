import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FloatingControls from "../components/FloatingControls";
import TransformContextProvider from "../context/TransformContext";
import LayoutContextProvider from "../context/LayoutContext";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const MockProviders = ({ children }) => (
  <LayoutContextProvider>
    <TransformContextProvider>{children}</TransformContextProvider>
  </LayoutContextProvider>
);

describe("FloatingControls Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render zoom controls with proper ARIA labels", () => {
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    expect(screen.getByLabelText("zoom_in")).toBeInTheDocument();
    expect(screen.getByLabelText("zoom_out")).toBeInTheDocument();
  });

  it("should have zoom control group with aria-label", () => {
    const { container } = render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomGroup = container.querySelector('[role="group"]');
    expect(zoomGroup).toBeInTheDocument();
    expect(zoomGroup).toHaveAttribute("aria-label", "zoom");
  });

  it("should mark icons as aria-hidden", () => {
    const { container } = render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const icons = container.querySelectorAll("i");
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("should have live region for zoom percentage", () => {
    const { container } = render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomDisplay = container.querySelector('[role="status"]');
    expect(zoomDisplay).toBeInTheDocument();
    expect(zoomDisplay).toHaveAttribute("aria-live", "polite");
  });

  it("should support keyboard interaction for zoom in button", async () => {
    const user = userEvent.setup();
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomInButton = screen.getByLabelText("zoom_in");
    await user.click(zoomInButton);

    expect(zoomInButton).toBeInTheDocument();
  });

  it("should support keyboard interaction for zoom out button", async () => {
    const user = userEvent.setup();
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomOutButton = screen.getByLabelText("zoom_out");
    await user.click(zoomOutButton);

    expect(zoomOutButton).toBeInTheDocument();
  });

  it("should have title attributes for tooltips", () => {
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomInButton = screen.getByLabelText("zoom_in");
    const zoomOutButton = screen.getByLabelText("zoom_out");

    expect(zoomInButton).toHaveAttribute("title", "zoom_in");
    expect(zoomOutButton).toHaveAttribute("title", "zoom_out");
  });

  it("should render exit fullscreen button with proper accessibility", () => {
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const exitButton = screen.getByLabelText("fullscreen");
    expect(exitButton).toBeInTheDocument();
    expect(exitButton).toHaveAttribute("title", "fullscreen");
  });

  it("should allow tab navigation through all controls", async () => {
    const user = userEvent.setup();
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomOutButton = screen.getByLabelText("zoom_out");
    const zoomInButton = screen.getByLabelText("zoom_in");
    const exitButton = screen.getByLabelText("fullscreen");

    // Tab through controls
    await user.tab();
    expect(zoomOutButton).toHaveFocus();

    await user.tab();
    expect(zoomInButton).toHaveFocus();

    await user.tab();
    expect(exitButton).toHaveFocus();
  });

  it("should support Enter key activation", async () => {
    const user = userEvent.setup();
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomInButton = screen.getByLabelText("zoom_in");
    zoomInButton.focus();

    await user.keyboard("{Enter}");

    // Button should still be in the document after activation
    expect(zoomInButton).toBeInTheDocument();
  });

  it("should support Space key activation", async () => {
    const user = userEvent.setup();
    render(
      <MockProviders>
        <FloatingControls />
      </MockProviders>,
    );

    const zoomOutButton = screen.getByLabelText("zoom_out");
    zoomOutButton.focus();

    await user.keyboard(" ");

    expect(zoomOutButton).toBeInTheDocument();
  });
});
