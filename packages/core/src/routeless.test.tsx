import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Desktop, DesktopApp, DesktopIcon } from "./desktop";
import { Window, WindowContent, WindowHeader, WindowName } from "./window";

/**
 * The core with nothing from the Next adapter: no route provider, no
 * `useWindowRoute`, no URLs. Keeping this working is what lets DayOS be used on
 * a single page, and it breaks easily by accident — all it takes is something
 * in the core starting to read the routing context.
 */
function App({ id, defaultOpen }: { id: string; defaultOpen?: boolean }) {
  return (
    <DesktopApp id={id} defaultOpen={defaultOpen}>
      <DesktopIcon>ICON({id})</DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>TITLE({id})</WindowName>
        </WindowHeader>
        <WindowContent>CONTENT({id})</WindowContent>
      </Window>
    </DesktopApp>
  );
}

describe("the core works without the routing adapter", () => {
  it("renders with no provider and without blowing up", () => {
    const html = renderToStaticMarkup(
      <Desktop>
        <App id="notes" />
      </Desktop>,
    );

    expect(html).toContain("ICON(notes)");
  });

  it("leaves no trace of a closed window in the DOM", () => {
    const html = renderToStaticMarkup(
      <Desktop>
        <App id="notes" />
      </Desktop>,
    );

    expect(html).not.toContain("CONTENT(notes)");
  });

  it("opens and closes on interaction, without touching the URL", async () => {
    const user = userEvent.setup();

    render(
      <Desktop>
        <App id="notes" />
      </Desktop>,
    );

    expect(screen.queryByText("CONTENT(notes)")).toBeNull();

    await user.dblClick(screen.getByRole("button", { name: /ICON\(notes\)/ }));

    expect(screen.getByText("CONTENT(notes)")).toBeTruthy();
  });
});

/**
 * The two ways of starting with an open window are not equivalent, and the
 * difference only shows up in the server HTML. It's documented on the
 * `defaultOpen` prop; these tests are what keep that documentation honest.
 */
describe("seeding an open window: during render or on mount", () => {
  it("the Desktop's defaultOpenWindows reaches the server HTML", () => {
    const html = renderToStaticMarkup(
      <Desktop defaultOpenWindows={["notes"]}>
        <App id="notes" />
      </Desktop>,
    );

    expect(html).toContain("CONTENT(notes)");
  });

  // It's applied from an effect because an app can't seed its parent's initial
  // state. If that ever becomes possible, this test fails and the fix is to
  // correct the prop's comment, not to delete the test.
  it("the DesktopApp's defaultOpen doesn't, because it runs on mount", () => {
    const html = renderToStaticMarkup(
      <Desktop>
        <App defaultOpen id="notes" />
      </Desktop>,
    );

    expect(html).not.toContain("CONTENT(notes)");
  });

  it("but defaultOpen does open the window on the client", () => {
    render(
      <Desktop>
        <App defaultOpen id="notes" />
      </Desktop>,
    );

    expect(screen.getByText("CONTENT(notes)")).toBeTruthy();
  });
});
