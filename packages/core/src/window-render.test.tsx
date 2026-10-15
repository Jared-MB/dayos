import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Desktop, DesktopApp, useDesktopApp } from "./desktop";
import { Window, WindowContent, WindowName } from "./window";
import { useWindowPresence, type WindowPresence } from "./window-presence";

let controls: ReturnType<typeof useDesktopApp>;
let presence: WindowPresence;

function Controls() {
  controls = useDesktopApp();
  return null;
}

/** Stands in for a `motion.section`: an element that plays an exit. */
function AnimatedBody(props: React.ComponentProps<"section">) {
  presence = useWindowPresence();
  return <article {...props} data-animated="" />;
}

function App({
  body,
  keepMounted,
}: {
  body?: React.ReactElement<React.ComponentProps<"section">>;
  keepMounted?: boolean;
}) {
  return (
    <DesktopApp id="notes" defaultOpen>
      <Controls />
      <Window render={body} keepMounted={keepMounted}>
        <WindowName>Notes</WindowName>
        <WindowContent>
          <textarea aria-label="Note" />
        </WindowContent>
      </Window>
    </DesktopApp>
  );
}

const dialog = () => document.querySelector<HTMLElement>("[role=dialog]");

describe("Window render", () => {
  it("swaps the body element and keeps what DayOS puts on it", () => {
    render(
      <Desktop>
        <App body={<article className="body" />} />
      </Desktop>,
    );

    const body = screen.getByRole("dialog", { name: "Notes" });

    expect(body.tagName).toBe("ARTICLE");
    expect(body.className).toBe("body");
    expect(body.style.display).toBe("flex");
    expect(body.dataset.state).toBe("open");
  });

  it("still closes on Escape, with the consumer's handler composed", () => {
    let pressed = false;
    const onKeyDown = () => {
      pressed = true;
    };

    render(
      <Desktop>
        <App body={<article onKeyDown={onKeyDown} />} />
      </Desktop>,
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(pressed).toBe(true);
    expect(dialog()).toBeNull();
  });

  it("renders the swapped element on the server too", () => {
    const html = renderToStaticMarkup(
      <Desktop defaultOpenWindows={["notes"]}>
        <App body={<article />} />
      </Desktop>,
    );

    expect(html).toContain("<article");
    expect(html).toContain('role="dialog"');
  });
});

describe("useWindowPresence", () => {
  it("without it, closing removes the window right away", () => {
    render(
      <Desktop>
        <App body={<article />} />
      </Desktop>,
    );

    act(() => controls.close());

    expect(dialog()).toBeNull();
  });

  it("keeps a closed window on screen until safeToRemove", () => {
    render(
      <Desktop>
        <App body={<AnimatedBody />} />
      </Desktop>,
    );

    act(() => controls.close());

    expect(presence.isPresent).toBe(false);
    expect(dialog()?.dataset.state).toBe("closed");
    expect(dialog()?.hasAttribute("inert")).toBe(true);

    act(() => presence.safeToRemove());

    expect(dialog()).toBeNull();
  });

  it("a reopen interrupts the exit, and its late safeToRemove does nothing", () => {
    render(
      <Desktop>
        <App body={<AnimatedBody />} />
      </Desktop>,
    );

    act(() => controls.close());
    act(() => controls.open());
    act(() => presence.safeToRemove());

    expect(presence.isPresent).toBe(true);
    expect(dialog()?.dataset.state).toBe("open");

    // The next close still gets its exit.
    act(() => controls.close());

    expect(dialog()?.dataset.state).toBe("closed");
  });

  it("with keepMounted, hides the window after the exit instead of unmounting", () => {
    render(
      <Desktop>
        <App body={<AnimatedBody />} keepMounted />
      </Desktop>,
    );

    act(() => controls.close());
    act(() => presence.safeToRemove());

    const body = dialog();

    expect(body).not.toBeNull();
    expect(body?.parentElement?.style.display).toBe("none");
  });

  it("minimize hides after the exit and close unmounts after it", () => {
    render(
      <Desktop>
        <App body={<AnimatedBody />} />
      </Desktop>,
    );

    act(() => controls.close({ keepMounted: true }));
    act(() => presence.safeToRemove());

    expect(dialog()?.parentElement?.style.display).toBe("none");

    act(() => controls.open());
    act(() => controls.close());
    act(() => presence.safeToRemove());

    expect(dialog()).toBeNull();
  });

  it("throws outside a Window", () => {
    expect(() => render(<AnimatedBody />)).toThrow(
      "useWindowPresence must be used within a Window",
    );
  });
});
