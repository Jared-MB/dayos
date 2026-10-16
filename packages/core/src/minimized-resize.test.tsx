import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Desktop, DesktopApp, useDesktopApp } from "./desktop";
import {
  Window,
  WindowActions,
  WindowContent,
  WindowHeader,
  WindowMinimize,
} from "./window";

const DESKTOP_SIZE = { width: 1000, height: 800 };

/**
 * jsdom has no layout: every box measures 0. These read the size back from the
 * inline styles `Rnd` writes, and 0 for a `display: none` box, which is what a
 * browser reports for a minimized window.
 */
function measure(element: HTMLElement, axis: "width" | "height") {
  if (element.style.display === "none") return 0;
  return Number.parseFloat(element.style[axis]) || 0;
}

let resizeDesktop: () => void = () => {};
let controls: ReturnType<typeof useDesktopApp>;

function Controls() {
  controls = useDesktopApp();
  return null;
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: () => void) {}
      observe() {
        const previous = resizeDesktop;
        resizeDesktop = () => {
          previous();
          this.callback();
        };
      }
      unobserve() {}
      disconnect() {}
    },
  );

  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    DESKTOP_SIZE.width,
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
    DESKTOP_SIZE.height,
  );
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return measure(this, "width");
    },
  );
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      return measure(this, "height");
    },
  );
});

afterEach(() => {
  resizeDesktop = () => {};
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a minimized window", () => {
  it("keeps its size when the desktop resizes while it's hidden", async () => {
    const user = userEvent.setup();

    render(
      <Desktop>
        <DesktopApp id="notes">
          <Controls />
          <Window defaultSize={{ width: 400, height: 300 }}>
            <WindowHeader>
              <WindowActions>
                <WindowMinimize />
              </WindowActions>
            </WindowHeader>
            <WindowContent>Notes</WindowContent>
          </Window>
        </DesktopApp>
      </Desktop>,
    );

    act(() => controls.open());
    await user.click(screen.getByRole("button", { name: "Minimize window" }));
    act(() => resizeDesktop());
    act(() => controls.open());

    const box = screen.getByRole("dialog").parentElement;
    expect(box?.style.width).toBe("400px");
    expect(box?.style.height).toBe("300px");
  });
});
