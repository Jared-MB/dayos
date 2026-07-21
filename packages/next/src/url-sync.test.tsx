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

  // Leaving lands on the exitHref, and that URL has a window of its own. It
  // must not open: the desktop the visitor asked for by closing the last
  // window is an empty one, and reopening the home window there means closing
  // it does nothing you can see.
  it("without the exitHref's own window opening as a result", async () => {
    const user = userEvent.setup();
    setLocation("/github");
    mount();

    await user.click(screen.getByRole("button", { name: "close /github" }));

    expect(screen.queryByText(windowMarker("/"))).toBe(null);
  });

  // The suppression is about the exit navigation, not about `/` forever: the
  // home icon is how you ask for that window, and it still has to work.
  it("but the home icon still opens it afterwards", async () => {
    const user = userEvent.setup();
    setLocation("/github");
    mount();

    await user.click(screen.getByRole("button", { name: "close /github" }));
    await user.dblClick(icon("/"));

    expect(screen.getByText(windowMarker("/"))).toBeTruthy();
  });

  // Suppressing the exit must not leave the opener deaf: the very next URL the
  // visitor asks for has to open its window as it always did.
  it("and a route visited after the exit still opens", async () => {
    const user = userEvent.setup();
    setLocation("/github");
    mount();

    await user.click(screen.getByRole("button", { name: "close /github" }));
    setLocation("/docs");

    expect(await screen.findByText(windowMarker("/docs"))).toBeTruthy();
  });
});

describe("landing on a URL opens its window", () => {
  // These two go through the state the provider seeds from the URL rather than
  // through the opener, which is why they can't speak for what the opener does
  // with `/`. The navigating cases below are the ones that can.
  it("including the exitHref, when that's where the visitor arrived", () => {
    setLocation("/");
    mount();

    expect(screen.getByText(windowMarker("/"))).toBeTruthy();
  });

  it("and any other route", () => {
    setLocation("/docs");
    mount();

    expect(screen.getByText(windowMarker("/docs"))).toBeTruthy();
  });

  // The exit is suppressed by recognising the URL the desktop wrote itself, and
  // not by treating `/` as unopenable. Arriving at `/` afterwards — a link, or
  // the back button — is the visitor asking for the home window, and the
  // difference between those two readings shows up only here.
  it("including `/` reached by navigating, with a window already open", async () => {
    setLocation("/docs");
    mount();

    setLocation("/");

    expect(await screen.findByText(windowMarker("/"))).toBeTruthy();
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
