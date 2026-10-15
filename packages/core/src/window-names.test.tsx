import { act, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Desktop, DesktopApp, useDesktop, useDesktopApp } from "./desktop";
import {
  Window,
  WindowActions,
  WindowHeader,
  WindowMinimize,
  WindowName,
} from "./window";

let desktop: ReturnType<typeof useDesktop>;
const apps: Record<string, ReturnType<typeof useDesktopApp>> = {};

function Controls() {
  const app = useDesktopApp();
  apps[app.id] = app;
  desktop = useDesktop();
  return null;
}

function App({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <DesktopApp id={id}>
      <Controls />
      <Window>
        <WindowHeader>
          <WindowName>{children}</WindowName>
          <WindowActions>
            <WindowMinimize />
          </WindowActions>
        </WindowHeader>
      </Window>
    </DesktopApp>
  );
}

describe("windowNames", () => {
  it("records each open window's WindowName under its id", () => {
    render(
      <Desktop>
        <App id="notes">Notes</App>
        <App id="mail">Mail</App>
      </Desktop>,
    );

    expect(desktop.windowNames).toEqual({});

    act(() => apps.notes?.open());
    act(() => apps.mail?.open());

    expect(desktop.windowNames).toEqual({ notes: "Notes", mail: "Mail" });
  });

  it("uses the rendered text, not just string children", () => {
    render(
      <Desktop>
        <App id="notes">
          <span aria-hidden>📝</span> <strong>Notes</strong>
        </App>
      </Desktop>,
    );

    act(() => apps.notes?.open());

    expect(desktop.windowNames.notes).toBe("📝 Notes");
  });

  it("keeps the name of a minimized window and drops a closed one's", () => {
    render(
      <Desktop>
        <App id="notes">Notes</App>
        <App id="mail">Mail</App>
      </Desktop>,
    );

    act(() => apps.notes?.open());
    act(() => apps.mail?.open());
    act(() => apps.notes?.close({ keepMounted: true }));
    act(() => apps.mail?.close());

    expect(desktop.minimizedWindows).toEqual(["notes"]);
    expect(desktop.windowNames).toEqual({ notes: "Notes" });
  });

  it("follows a name that changes", () => {
    let rename: (name: string) => void = () => {};

    function Renamable() {
      const [name, setName] = useState("Untitled");
      rename = setName;
      return <App id="notes">{name}</App>;
    }

    render(
      <Desktop>
        <Renamable />
      </Desktop>,
    );

    act(() => apps.notes?.open());
    act(() => rename("Shopping list"));

    expect(desktop.windowNames.notes).toBe("Shopping list");
  });
});
