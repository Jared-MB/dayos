import { render, screen, within } from "@testing-library/react";
import { Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutedApp, windowMarker } from "../test/fixtures";
import { setLocation } from "../test/next-router";
import { RoutedDesktop, useDynamicWindows, WindowRouteProvider } from "./index";

/**
 * `/documents/new` is declared alongside the pattern on purpose: a static
 * segment and a param compete at the same depth, and that's the pair that says
 * which one the desktop picks.
 */
const ROUTES = ["/", "/documents", "/documents/:file", "/documents/new"];

const PATTERN = "/documents/:file";

/**
 * What an app has to write for a pattern: one `DesktopApp` per open instance.
 * The hrefs come from the desktop, so nothing here tracks which documents have
 * been visited.
 */
function DocumentApps() {
  const windows = useDynamicWindows(PATTERN);

  return windows.map(({ href, params }) => (
    <Fragment key={href}>
      <RoutedApp href={href} />
      {/* Reveals the param the pattern filled in, next to its window. */}
      <span>PARAM({params.file})</span>
    </Fragment>
  ));
}

const tree = (pathname: string, content: React.ReactNode = null) => {
  setLocation(pathname);

  return (
    <WindowRouteProvider content={content} routes={ROUTES}>
      <RoutedDesktop>
        {ROUTES.filter((route) => route !== PATTERN).map((href) => (
          <RoutedApp href={href} key={href} />
        ))}
        <DocumentApps />
      </RoutedDesktop>
    </WindowRouteProvider>
  );
};

const openWindows = (html: string) =>
  [...html.matchAll(/WINDOW\((.*?)\)/g)].map(([, href]) => href as string);

const windowFor = (href: string) => {
  const dialog = screen
    .getByText(windowMarker(href))
    .closest('[role="dialog"]');

  if (!dialog) throw new Error(`window ${href} is not open`);

  return within(dialog as HTMLElement);
};

/** Navigates the way Next does: URL and layout `children` change at once. */
const navigate = (
  rerender: (ui: React.ReactNode) => void,
  href: string,
  content?: React.ReactNode,
) => {
  setLocation(href);
  rerender(tree(href, content));
};

describe("a pattern in the server HTML", () => {
  // The point of declaring the pattern at all: a link straight to a document
  // has to come back with that document's window already in the markup, and the
  // app can't have declared `/documents/violin.avif` up front.
  it("opens a window identified by the URL it matched", () => {
    expect(
      openWindows(renderToStaticMarkup(tree("/documents/violin.avif"))),
    ).toEqual(["/documents/violin.avif"]);
  });

  it("puts the page's content inside it", () => {
    const html = renderToStaticMarkup(
      tree("/documents/violin.avif", <p>PAGE_CONTENT</p>),
    );

    expect(html).toContain("PAGE_CONTENT");
  });

  it("prefers a static segment to a param at the same depth", () => {
    expect(openWindows(renderToStaticMarkup(tree("/documents/new")))).toEqual([
      "/documents/new",
    ]);
  });

  // The pattern consumes its segments and no more, so what's under an instance
  // is that instance's subroute rather than a window of its own.
  it("names the window after the segments the pattern consumed", () => {
    expect(
      openWindows(renderToStaticMarkup(tree("/documents/violin.avif/notes"))),
    ).toEqual(["/documents/violin.avif"]);
  });

  it("still leaves an unclaimed URL without a window", () => {
    expect(openWindows(renderToStaticMarkup(tree("/nope/deeper")))).toEqual([]);
  });
});

describe("opening a document from the list", () => {
  // The whole reason patterns exist. An ordinary `<Link>` has to be enough:
  // when the app had to register the route before navigating, every link
  // written without that step silently opened the document inside the list.
  it("opens a second window without the app registering anything", () => {
    const { rerender } = render(tree("/documents", <p>LIST</p>));

    navigate(rerender, "/documents/violin.avif", <p>VIOLIN</p>);

    expect(
      windowFor("/documents/violin.avif").getByText("VIOLIN"),
    ).toBeTruthy();
    expect(windowFor("/documents").getByText("LIST")).toBeTruthy();
  });

  it("gives each visited document a window of its own", () => {
    const { rerender } = render(tree("/documents", <p>LIST</p>));

    navigate(rerender, "/documents/violin.avif", <p>VIOLIN</p>);
    navigate(rerender, "/documents/sheets.avif", <p>SHEETS</p>);

    expect(
      windowFor("/documents/violin.avif").getByText("VIOLIN"),
    ).toBeTruthy();
    expect(
      windowFor("/documents/sheets.avif").getByText("SHEETS"),
    ).toBeTruthy();
  });

  // Reopening has to hand back the window that's already there. Keying the
  // instance off anything but the URL would stack a duplicate on every visit,
  // and duplicate ids are what the core warns about.
  it("reuses the window when the same document is opened twice", () => {
    const { rerender } = render(tree("/documents", <p>LIST</p>));

    navigate(rerender, "/documents/violin.avif", <p>VIOLIN</p>);
    navigate(rerender, "/documents", <p>LIST</p>);
    navigate(rerender, "/documents/violin.avif", <p>VIOLIN</p>);

    expect(
      screen.getAllByText(windowMarker("/documents/violin.avif")),
    ).toHaveLength(1);
  });
});

describe("useDynamicWindows", () => {
  // `/documents/new` has a route and an app of its own, so the pattern must not
  // claim it too: the app would render a second `DesktopApp` under the same id,
  // which is the duplicate the core warns about.
  it("leaves out a window a more specific route claims", () => {
    const { rerender } = render(tree("/documents", <p>LIST</p>));

    navigate(rerender, "/documents/new", <p>NEW</p>);

    expect(screen.getAllByText(windowMarker("/documents/new"))).toHaveLength(1);
  });

  // Without them every caller takes the href apart again to recover what the
  // matching had already worked out.
  it("hands over the params the pattern filled in", () => {
    const { rerender } = render(tree("/documents", <p>LIST</p>));

    navigate(rerender, "/documents/violin.avif", <p>VIOLIN</p>);

    expect(screen.getByText("PARAM(violin.avif)")).toBeTruthy();
  });

  // What a Next page gets in its own `params` is decoded, and a window reading
  // `params.file` is after the name of the thing, not its URL spelling.
  it("decodes them", () => {
    const { rerender } = render(tree("/documents", <p>LIST</p>));

    navigate(rerender, "/documents/sheet%20music.avif", <p>SHEETS</p>);

    expect(screen.getByText("PARAM(sheet music.avif)")).toBeTruthy();
  });

  // The href is the window's identity and gets compared against the pathname,
  // so it has to keep the URL's spelling even while the param loses it.
  it("but leaves the href as the URL spells it", () => {
    const { rerender } = render(tree("/documents", <p>LIST</p>));

    navigate(rerender, "/documents/sheet%20music.avif", <p>SHEETS</p>);

    expect(
      screen.getByText(windowMarker("/documents/sheet%20music.avif")),
    ).toBeTruthy();
  });
});
