import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES, windowMarker } from "../test/fixtures";
import { routerState, setLocation } from "../test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./index";

const mount = () =>
  render(
    <WindowRouteProvider content={null} routes={TEST_ROUTES}>
      <RoutedDesktop>
        {TEST_ROUTES.map((href) => (
          <RoutedApp href={href} key={href} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>,
  );

const icon = (href: string) =>
  screen.getByRole("button", { name: `ICON(${href})` });

describe("the URL follows the active window", () => {
  it("takes the URL to a window's route when it opens", async () => {
    const user = userEvent.setup();
    setLocation("/");
    mount();

    await user.dblClick(icon("/github"));

    expect(routerState.replace).toHaveBeenCalledWith("/github");
  });

  it("goes back to exitHref when the last window closes", async () => {
    const user = userEvent.setup();
    setLocation("/github");
    mount();

    await user.click(screen.getByRole("button", { name: "close /github" }));

    expect(routerState.replace).toHaveBeenCalledWith("/");
  });

  // Returning to a window has to bring back the URL it had, not its bare href:
  // otherwise wandering around the desktop wipes every window's params.
  it("restores a window's query when you come back to it", async () => {
    const user = userEvent.setup();
    setLocation("/docs?page=2");
    mount();

    await user.dblClick(icon("/github"));
    expect(routerState.replace).toHaveBeenLastCalledWith("/github");

    await user.click(screen.getByText(windowMarker("/docs")));

    expect(routerState.replace).toHaveBeenLastCalledWith("/docs?page=2");
  });
});

describe("the initial load doesn't navigate", () => {
  // The initial state already reflects the requested URL, so navigating would
  // be redundant and would fire a `replace` on every single visit.
  it("when the URL opens a window", () => {
    setLocation("/github");
    mount();

    expect(routerState.replace).not.toHaveBeenCalled();
  });

  // Without this guard, landing on a URL with no window — a 404, say — sends
  // the visitor to the desktop and eats the page they actually wanted to see.
  it("when the URL belongs to no window", () => {
    setLocation("/does-not-exist");
    mount();

    expect(routerState.replace).not.toHaveBeenCalled();
  });
});
