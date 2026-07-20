import { render, screen, within } from "@testing-library/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES, windowMarker } from "../test/fixtures";
import { setLocation } from "../test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./index";

/**
 * Every window has to keep showing its own route's content when focus moves
 * elsewhere. What Next's router hands over isn't content but a pointer to the
 * active segment, so storing the node isn't enough: re-rendering it paints
 * today's route and every window ends up showing the same thing. That's why
 * `useWindowRoute` also stores the router context from when the route was
 * active, and re-provides it around the frozen node.
 *
 * Here the context is provided by the test, not by Next. That doesn't reproduce
 * a real segment — the node is an ordinary element and not a pointer — but it
 * does verify the one thing `DayOS` controls: that the frozen subtree sees the
 * context from its own moment and not the current route's.
 */
const routerFor = (segment: string) =>
  ({ tree: segment }) as unknown as React.ContextType<
    typeof LayoutRouterContext
  >;

/** Reveals which router context the subtree it's mounted in can see. */
function SegmentProbe() {
  const context = useContext(LayoutRouterContext);

  return (
    <span>
      SEGMENT({(context as unknown as { tree?: string })?.tree ?? "none"})
    </span>
  );
}

const pageFor = (href: string) => (
  <>
    <p>CONTENT({href})</p>
    <SegmentProbe />
  </>
);

const tree = (href: string) => (
  <LayoutRouterContext value={routerFor(href)}>
    <WindowRouteProvider content={pageFor(href)} routes={TEST_ROUTES}>
      <RoutedDesktop>
        {TEST_ROUTES.map((route) => (
          <RoutedApp href={route} key={route} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>
  </LayoutRouterContext>
);

/** A window's dialog, so each one can be asserted on separately. */
const windowFor = (href: string) => {
  const dialog = screen
    .getByText(windowMarker(href))
    .closest('[role="dialog"]');

  if (!dialog) throw new Error(`window ${href} is not open`);

  return within(dialog as HTMLElement);
};

/** Navigates the way Next does: changes the URL and the layout's `children` at once. */
const navigate = (rerender: (ui: React.ReactNode) => void, href: string) => {
  setLocation(href);
  rerender(tree(href));
};

describe("each window's content survives a focus change", () => {
  it("keeps the content of the window that lost focus", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    expect(windowFor("/docs").getByText("CONTENT(/docs)")).toBeTruthy();

    navigate(rerender, "/github");

    // The github one shows its own and the docs one keeps its own: without the
    // freezing, both would show github's content.
    expect(windowFor("/github").getByText("CONTENT(/github)")).toBeTruthy();
    expect(windowFor("/docs").getByText("CONTENT(/docs)")).toBeTruthy();
    expect(windowFor("/docs").queryByText("CONTENT(/github)")).toBeNull();
  });

  // This is the whole reason for storing the context alongside the node. If the
  // frozen subtree were rendered without re-providing it, it would read the
  // current route's router and the node would resolve to the wrong segment.
  it("and also the router context it had at that moment", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    navigate(rerender, "/github");

    expect(windowFor("/docs").getByText("SEGMENT(/docs)")).toBeTruthy();
    expect(windowFor("/github").getByText("SEGMENT(/github)")).toBeTruthy();
  });

  // The freezing has to be reversible and symmetric: coming back thaws the one
  // that was idle and freezes the one being left. If the snapshot got stuck,
  // this would show the docs window with stale content.
  it("thaws a window on return and freezes the other one", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    navigate(rerender, "/github");
    navigate(rerender, "/docs");

    expect(windowFor("/docs").getByText("CONTENT(/docs)")).toBeTruthy();
    expect(windowFor("/docs").getByText("SEGMENT(/docs)")).toBeTruthy();
    expect(windowFor("/github").getByText("CONTENT(/github)")).toBeTruthy();
    expect(windowFor("/github").getByText("SEGMENT(/github)")).toBeTruthy();
  });
});

describe("while a window is the current route its content stays live", () => {
  // Freezing too eagerly would break navigating inside a window: the content
  // would be pinned to the first view it ever showed.
  it("updates what it shows when you navigate inside the window", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    navigate(rerender, "/docs/api");

    expect(windowFor("/docs/api").getByText("CONTENT(/docs/api)")).toBeTruthy();
  });
});
