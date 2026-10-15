import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Desktop,
  DesktopApp,
  type DesktopAppProps,
  useDesktop,
  useDesktopApp,
} from "./desktop";
import {
  Window,
  WindowActions,
  WindowClose,
  WindowContent,
  WindowHeader,
  WindowMinimize,
} from "./window";

/**
 * Exposes the app's controls to the test. Buttons would do the job too, but
 * they'd live inside the window, and the window is what's being unmounted.
 */
let controls: ReturnType<typeof useDesktopApp>;
let desktop: ReturnType<typeof useDesktop>;

function Controls() {
  controls = useDesktopApp();
  desktop = useDesktop();
  return null;
}

function App({
  keepMounted,
  ...props
}: Omit<DesktopAppProps, "children"> & { keepMounted?: boolean }) {
  return (
    <DesktopApp id="notes" {...props}>
      <Controls />
      <Window keepMounted={keepMounted}>
        <WindowHeader>
          <WindowActions>
            <WindowMinimize />
            <WindowClose />
          </WindowActions>
        </WindowHeader>
        <WindowContent>
          <textarea aria-label="Note" />
        </WindowContent>
      </Window>
    </DesktopApp>
  );
}

const textarea = () => document.querySelector("textarea");

async function openAndType(text: string) {
  act(() => controls.open());
  const field = textarea();
  if (!field) throw new Error("the window didn't open");
  await userEvent.setup().type(field, text);
}

describe("closing with keepMounted", () => {
  it("close({ keepMounted: true }) hides the window and keeps its state", async () => {
    render(
      <Desktop>
        <App />
      </Desktop>,
    );

    await openAndType("draft");
    act(() => controls.close({ keepMounted: true }));

    expect(controls.isWindowOpen).toBe(false);
    expect(textarea()?.value).toBe("draft");

    act(() => controls.open());

    expect(textarea()?.value).toBe("draft");
  });

  it("closeWindow(id, { keepMounted: true }) does the same from the desktop", async () => {
    render(
      <Desktop>
        <App />
      </Desktop>,
    );

    await openAndType("draft");
    act(() => desktop.closeWindow("notes", { keepMounted: true }));

    expect(textarea()?.value).toBe("draft");
  });

  it("only covers the close it was passed to", async () => {
    render(
      <Desktop>
        <App />
      </Desktop>,
    );

    await openAndType("draft");
    act(() => controls.close({ keepMounted: true }));
    act(() => controls.open());
    act(() => controls.close());

    expect(textarea()).toBeNull();
  });

  it("doesn't remount a window that was already closed", async () => {
    render(
      <Desktop>
        <App />
      </Desktop>,
    );

    await openAndType("draft");
    act(() => controls.close());
    act(() => controls.close({ keepMounted: true }));

    expect(textarea()).toBeNull();
  });

  it("is ignored when close gets an event, as with onClick={close}", async () => {
    render(
      <Desktop>
        <App />
      </Desktop>,
    );

    await openAndType("draft");
    act(() => controls.close({} as React.MouseEvent));

    expect(textarea()).toBeNull();
  });

  it("leaves the Window's keepMounted prop working on a plain close", async () => {
    render(
      <Desktop>
        <App keepMounted />
      </Desktop>,
    );

    await openAndType("draft");
    act(() => controls.close());

    expect(textarea()?.value).toBe("draft");
  });
});

describe("WindowMinimize", () => {
  it("closes the window and keeps its state", async () => {
    const user = userEvent.setup();

    render(
      <Desktop>
        <App />
      </Desktop>,
    );

    await openAndType("draft");
    await user.click(screen.getByRole("button", { name: "Minimize window" }));

    expect(controls.isWindowOpen).toBe(false);
    expect(textarea()?.value).toBe("draft");
  });

  it("while WindowClose next to it unmounts", async () => {
    const user = userEvent.setup();

    render(
      <Desktop>
        <App />
      </Desktop>,
    );

    await openAndType("draft");
    await user.click(screen.getByRole("button", { name: "Close window" }));

    expect(textarea()).toBeNull();
  });

  it("can be cancelled from its own onClick", async () => {
    const user = userEvent.setup();

    render(
      <Desktop>
        <DesktopApp id="notes">
          <Controls />
          <Window>
            <WindowMinimize onClick={(event) => event.preventDefault()} />
          </Window>
        </DesktopApp>
      </Desktop>,
    );

    act(() => controls.open());
    await user.click(screen.getByRole("button", { name: "Minimize window" }));

    expect(controls.isWindowOpen).toBe(true);
  });
});
