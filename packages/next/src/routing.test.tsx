import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES, windowMarker } from "../test/fixtures";
import { setLocation } from "../test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./index";

/**
 * Everything here is measured against the server HTML and not a client render.
 * That's not a detail: `useWindowRoute` also opens the window from an effect,
 * so on the client the right window would end up open even if the render-time
 * matching were broken. Only the server markup tells "seeded during render"
 * apart from "opened after mount", which is exactly the regression these tests
 * have to catch.
 */
const serverHtml = (pathname: string, content: React.ReactNode = null) => {
  setLocation(pathname);

  return renderToStaticMarkup(
    <WindowRouteProvider content={content} routes={TEST_ROUTES}>
      <RoutedDesktop>
        {TEST_ROUTES.map((href) => (
          <RoutedApp href={href} key={href} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>,
  );
};

const openWindows = (html: string) =>
  TEST_ROUTES.filter((href) => html.includes(windowMarker(href)));

describe("which window the server opens for each URL", () => {
  it("opens exactly one window and it's the requested route's", () => {
    expect(openWindows(serverHtml("/github"))).toEqual(["/github"]);
  });

  // `matchesRoute` requires the prefix to end at a `/`. Simplifying it to
  // `startsWith(href)` makes any route a prefix of longer names, and turns `/`
  // into a prefix of the entire site along the way.
  it("requires the prefix to break on a whole segment", () => {
    expect(openWindows(serverHtml("/githubbers"))).toEqual([]);
    expect(openWindows(serverHtml("/docsy"))).toEqual([]);
  });

  it("lets a window cover its subroutes", () => {
    expect(openWindows(serverHtml("/docs/installation"))).toEqual(["/docs"]);
  });

  // Without sorting by length the first declared one wins, which here would be
  // `/docs`.
  it("picks the most specific of two nested routes", () => {
    expect(openWindows(serverHtml("/docs/api"))).toEqual(["/docs/api"]);
  });

  it("opens nothing for a URL with no window", () => {
    expect(openWindows(serverHtml("/does-not-exist"))).toEqual([]);
  });
});

describe("page content in the server HTML", () => {
  const content = <p>PAGE_CONTENT</p>;

  it("delivers it inside its route's window", () => {
    const html = serverHtml("/github", content);
    const marker = windowMarker("/github");

    expect(html).toContain("PAGE_CONTENT");
    // Inside the window, not loose on the desktop: the window's marker has to
    // show up before the content.
    expect(html.indexOf(marker)).toBeLessThan(html.indexOf("PAGE_CONTENT"));
  });

  it("doesn't duplicate it", () => {
    const html = serverHtml("/github", content);
    const times = html.split("PAGE_CONTENT").length - 1;

    expect(times).toBe(1);
  });

  // This is what makes every URL separately indexable: if the content came out
  // with no window to claim it, there'd be nothing to index.
  it("drops it when no window claims the route", () => {
    expect(serverHtml("/does-not-exist", content)).not.toContain(
      "PAGE_CONTENT",
    );
  });
});
