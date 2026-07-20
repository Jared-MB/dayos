import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Desktop, DesktopApp, DesktopIcon } from "./desktop";
import { Window, WindowContent } from "./window";

function App({ id }: { id: string }) {
  return (
    <DesktopApp id={id}>
      <DesktopIcon>ICON({id})</DesktopIcon>
      <Window>
        <WindowContent>CONTENT({id})</WindowContent>
      </Window>
    </DesktopApp>
  );
}

const duplicateWarnings = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.filter(([first]) =>
    String(first).includes("duplicate DesktopApp id"),
  );

const spyOnConsoleError = () =>
  vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => vi.restoreAllMocks());

/**
 * A duplicate id breaks nothing visible: the two apps share window state and
 * open in the same spot, so it looks like a single window showing the wrong
 * content. Without the warning that's a long afternoon of debugging.
 */
describe("duplicate id warning", () => {
  it("warns when two apps declare the same id", () => {
    const error = spyOnConsoleError();

    render(
      <Desktop>
        <App id="notes" />
        <App id="notes" />
      </Desktop>,
    );

    expect(duplicateWarnings(error)).toHaveLength(1);
    expect(String(duplicateWarnings(error)[0]?.[0])).toContain('"notes"');
  });

  it("doesn't warn on distinct ids", () => {
    const error = spyOnConsoleError();

    render(
      <Desktop>
        <App id="notes" />
        <App id="photos" />
      </Desktop>,
    );

    expect(duplicateWarnings(error)).toHaveLength(0);
  });

  // The registry counts mounts instead of holding a Set for exactly this
  // reason: StrictMode mounts, unmounts and mounts each app again in
  // development, and with a Set the second mount would read as a duplicate.
  it("doesn't warn about StrictMode's double mount", () => {
    const error = spyOnConsoleError();

    render(
      <StrictMode>
        <Desktop>
          <App id="notes" />
        </Desktop>
      </StrictMode>,
    );

    expect(duplicateWarnings(error)).toHaveLength(0);
  });

  it("releases the id on unmount, so remounting doesn't warn", () => {
    const error = spyOnConsoleError();

    const { unmount } = render(
      <Desktop>
        <App id="notes" />
      </Desktop>,
    );

    unmount();

    render(
      <Desktop>
        <App id="notes" />
      </Desktop>,
    );

    expect(duplicateWarnings(error)).toHaveLength(0);
  });
});
