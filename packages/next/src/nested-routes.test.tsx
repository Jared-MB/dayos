import { render, screen, within } from "@testing-library/react";
import { Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutedApp, windowMarker } from "../test/fixtures";
import { setLocation } from "../test/next-router";
import { RoutedDesktop, useDynamicWindows, WindowRouteProvider } from "./index";

/**
 * Three levels, with a static route beside the dynamic one at each level below
 * the first. Two segments was as deep as anything went, and the pair that
 * `/documents` can't produce is the third level's: `/projects/:project/new` is
 * static where it competes and still a pattern overall.
 */
const PROJECT = "/projects/:project";
const NEW_TASK = "/projects/:project/new";
const TASK = "/projects/:project/:task";

const PATTERNS = [PROJECT, NEW_TASK, TASK];

const ROUTES = ["/", "/projects", "/projects/archive", ...PATTERNS];

/**
 * The marker names the pattern as well as the window, because at the third
 * level two patterns produce the *same* href — they consume the same segments —
 * and differ only in which of them claims it. That choice is what decides which
 * app renders the window, so it's the thing worth asserting.
 */
const claimMarker = (href: string, pattern: string) =>
  `CLAIM(${href} by ${pattern})`;

function PatternApps({ pattern }: { pattern: string }) {
  return useDynamicWindows(pattern).map(({ href }) => (
    <Fragment key={href}>
      <RoutedApp href={href} />
      <span>{claimMarker(href, pattern)}</span>
    </Fragment>
  ));
}

const tree = (pathname: string, content: React.ReactNode = null) => {
  setLocation(pathname);

  return (
    <WindowRouteProvider content={content} routes={ROUTES}>
      <RoutedDesktop>
        {ROUTES.filter((route) => !PATTERNS.includes(route)).map((href) => (
          <RoutedApp href={href} key={href} />
        ))}
        {PATTERNS.map((pattern) => (
          <PatternApps key={pattern} pattern={pattern} />
        ))}
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

const navigate = (
  rerender: (ui: React.ReactNode) => void,
  href: string,
  content?: React.ReactNode,
) => {
  setLocation(href);
  rerender(tree(href, content));
};

describe("which window a nested URL belongs to", () => {
  it("gives the third level a window of its own", () => {
    expect(
      openWindows(renderToStaticMarkup(tree("/projects/atlas/survey"))),
    ).toEqual(["/projects/atlas/survey"]);
  });

  // A literal beats a param at the same depth, so this is the archive's window
  // and not a project window that thinks it's called "archive".
  it("prefers the static route at the second level", () => {
    expect(
      openWindows(renderToStaticMarkup(tree("/projects/archive"))),
    ).toEqual(["/projects/archive"]);
  });

  // The same rule one level deeper, where both candidates are patterns. They
  // consume the same segments and so name the same window, which is why this
  // asserts the claiming pattern: the href alone can't tell them apart, and
  // comparing declared string length — what specificity used to be — picks
  // `:task` here while leaving the href looking perfectly correct.
  it("and at the third, where both candidates are patterns", () => {
    const html = renderToStaticMarkup(tree("/projects/atlas/new"));

    expect(openWindows(html)).toEqual(["/projects/atlas/new"]);
    expect(html).toContain(claimMarker("/projects/atlas/new", NEW_TASK));
    expect(html).not.toContain(claimMarker("/projects/atlas/new", TASK));
  });

  // The window is named after the URL the pattern matched, so a pattern that
  // ends in a literal still stands for one window per project.
  it("so a pattern ending in a literal is still one window per project", () => {
    const { rerender } = render(tree("/projects"));

    navigate(rerender, "/projects/atlas/new");
    navigate(rerender, "/projects/harbor/new");

    expect(screen.getByText(windowMarker("/projects/atlas/new"))).toBeTruthy();
    expect(screen.getByText(windowMarker("/projects/harbor/new"))).toBeTruthy();
  });
});

describe("three levels open at once", () => {
  // The point of the whole section: descending doesn't replace what you came
  // from, so the list, the project and the task are three windows side by side.
  it("keeps every level open as you descend", async () => {
    const { rerender } = render(tree("/projects", <p>LIST</p>));

    navigate(rerender, "/projects/atlas", <p>PROJECT</p>);
    navigate(rerender, "/projects/atlas/survey", <p>TASK</p>);

    expect(screen.getByText(windowMarker("/projects"))).toBeTruthy();
    expect(screen.getByText(windowMarker("/projects/atlas"))).toBeTruthy();
    expect(
      screen.getByText(windowMarker("/projects/atlas/survey")),
    ).toBeTruthy();
  });

  // Each keeps the page it was showing rather than mirroring the active one,
  // which is what a shared router context would have them do.
  it("each showing its own page", () => {
    const { rerender } = render(tree("/projects", <p>LIST</p>));

    navigate(rerender, "/projects/atlas", <p>PROJECT</p>);
    navigate(rerender, "/projects/atlas/survey", <p>TASK</p>);

    expect(windowFor("/projects").getByText("LIST")).toBeTruthy();
    expect(windowFor("/projects/atlas").getByText("PROJECT")).toBeTruthy();
    expect(windowFor("/projects/atlas/survey").getByText("TASK")).toBeTruthy();
  });

  // Landing straight on the deepest URL is not the same as descending to it:
  // only the window the URL belongs to opens, and the levels above it don't.
  it("but landing on the deepest one opens only that", () => {
    expect(
      openWindows(renderToStaticMarkup(tree("/projects/atlas/survey"))),
    ).not.toContain("/projects");
  });
});
