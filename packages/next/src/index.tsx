"use client";

import {
  Desktop,
  type DesktopProps,
  useDesktop,
  useOptionalDesktopApp,
} from "@dayos/core";
// Internal to Next and not part of its public API: it's the price of keeping
// per-window content without parallel routes. If a Next update moves this
// module, this stops compiling and needs another look.
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * The current route's content, so the window it belongs to can render it inside
 * itself instead of leaving it loose on the desktop.
 */
const RouteContentContext = createContext<React.ReactNode>(null);

type WindowRoutesContextType = {
  /**
   * Routes declared by the desktop. Each window's href is also its app id:
   * they're the same identity, and holding it in one place avoids declaring the
   * same string in the layout and in the component.
   */
  routes: readonly string[];
  openWindows: string[];
  setOpenWindows: (openWindows: string[]) => void;
};

const WindowRoutesContext = createContext<WindowRoutesContextType | null>(null);

const useWindowRoutes = () => {
  const context = useContext(WindowRoutesContext);

  if (!context)
    throw new Error("DayOS routing must be used within a WindowRouteProvider");

  return context;
};

const segmentsOf = (path: string) => path.split("/").filter(Boolean);

const isParam = (segment: string) => segment.startsWith(":");

/** What a pattern's params resolved to, keyed by the name after the colon. */
export type RouteParams = Record<string, string>;

/**
 * Params come out decoded, the way a Next page's do, so what a window gets is
 * the name of the thing and not its URL spelling. The href keeps the spelling:
 * it identifies the window and gets compared against the pathname.
 */
const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    // A malformed escape isn't worth throwing a render over — the raw segment
    // is still what the URL says.
    return segment;
  }
};

/**
 * What a route claims for a pathname — the href and the params it filled in —
 * or `null` when it doesn't match.
 *
 * A route only has to cover the start of the pathname, because a window owns
 * its subroutes: `/docs` claims `/docs/api` and the href stays `/docs`. That's
 * also what a pattern returns — the segments it consumed and not the whole
 * pathname — so `/documents/:file` opens one window per document and a deeper
 * URL under it is that same window's subroute.
 *
 * Matching by segment and not by string prefix is what keeps `/docs` from
 * claiming `/docsy`.
 */
const matchRoute = (
  route: string,
  pathname: string,
): { href: string; params: RouteParams } | null => {
  const routeSegments = segmentsOf(route);
  const pathSegments = segmentsOf(pathname);

  // The root is the exception to subroute ownership: it consumes no segments,
  // so covering what's under it would make every URL on the site the home
  // window's, and a URL belonging to no route — a 404 — would stop being one.
  if (routeSegments.length === 0)
    return pathSegments.length === 0 ? { href: "/", params: {} } : null;

  if (pathSegments.length < routeSegments.length) return null;

  const params: RouteParams = {};

  for (const [index, segment] of routeSegments.entries()) {
    const value = pathSegments[index] as string;

    if (!isParam(segment)) {
      if (segment !== value) return null;
      continue;
    }

    params[segment.slice(1)] = decodeSegment(value);
  }

  return {
    href: `/${pathSegments.slice(0, routeSegments.length).join("/")}`,
    params,
  };
};

/**
 * How specific a route is, for picking a winner when several match. More
 * segments first — `/docs/api` beats `/docs`, which is why the specific window
 * opens and not the one containing it — and a static segment beats a param at
 * the same depth, so `/documents/new` wins over `/documents/:file`.
 *
 * It used to be the declared string's length, which happened to agree on the
 * static cases and stops agreeing the moment a param is shorter than what it
 * stands for.
 */
const compareSpecificity = (a: string, b: string) => {
  const aSegments = segmentsOf(a);
  const bSegments = segmentsOf(b);

  if (aSegments.length !== bSegments.length)
    return bSegments.length - aSegments.length;

  for (const [index, segment] of aSegments.entries()) {
    const other = bSegments[index] as string;
    if (isParam(segment) !== isParam(other)) return isParam(segment) ? 1 : -1;
  }

  return 0;
};

/**
 * The window a pathname belongs to: the most specific route that claims it,
 * with the concrete href and params it resolved to. A pattern's window is
 * identified by the URL it matched, which is what lets a route declared once
 * open a window per document without the app tracking them.
 */
const resolveRoute = (routes: readonly string[], pathname: string) => {
  const [route] = [...routes]
    .filter((candidate) => matchRoute(candidate, pathname) !== null)
    .sort(compareSpecificity);

  if (!route) return undefined;

  const match = matchRoute(route, pathname) as {
    href: string;
    params: RouteParams;
  };

  return { route, ...match };
};

const findRoute = (routes: readonly string[], pathname: string) =>
  resolveRoute(routes, pathname)?.href;

const currentUrl = () =>
  window.location.pathname + window.location.search + window.location.hash;

export function WindowRouteProvider({
  content,
  routes,
  children,
}: {
  /** The layout's `children`, i.e. whatever the current page returns. */
  content: React.ReactNode;
  /**
   * Every route on the desktop, declared up front. Each window used to register
   * its own from an effect, and that's why the server never got to know which
   * one the requested URL belonged to.
   */
  routes: readonly string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Seeding the state here and not in an effect is the whole point of this
  // module: on the server `usePathname` already knows which route was
  // requested, so the matching window is born open and its content makes it
  // into the HTML. While this lived in an effect, the HTML always came out with
  // an empty desktop and the page's content was thrown away: there was no
  // window around to claim it.
  const [openWindows, setOpenWindows] = useState<string[]>(() => {
    const match = findRoute(routes, pathname);
    return match ? [match] : [];
  });

  const value = useMemo(
    () => ({ routes, openWindows, setOpenWindows }),
    [routes, openWindows],
  );

  return (
    <WindowRoutesContext value={value}>
      <RouteContentContext value={content}>{children}</RouteContentContext>
    </WindowRoutesContext>
  );
}

export type RoutedDesktopProps = Omit<
  DesktopProps,
  "openWindows" | "defaultOpenWindows" | "onOpenWindowsChange"
> & {
  /** Where the URL goes when no window is left open. */
  exitHref?: string;
};

/**
 * `Desktop` with its window state delegated to the provider, which is what
 * seeded it from the URL. It also solely owns the reverse sync (front window →
 * URL): every window used to run that same sync, so with N routed apps you got
 * N `replace` calls per focus change.
 */
export function RoutedDesktop({
  children,
  exitHref = "/",
  ...props
}: RoutedDesktopProps) {
  const { routes, openWindows, setOpenWindows } = useWindowRoutes();
  const router = useRouter();
  const pathname = usePathname();

  const activeWindowId = openWindows.at(-1);

  // Not every app is routed: one that opens an external link has a generated id
  // and no URL of its own. A routed window's id is a URL a route claims whole,
  // which covers the ones a pattern produced and were never declared verbatim.
  const activeHref =
    activeWindowId && findRoute(routes, activeWindowId) === activeWindowId
      ? activeWindowId
      : undefined;

  // Each window's last real URL, query and hash included. Storing just the
  // `href` would mean returning to a window wipes the params it had.
  const lastUrlByWindow = useRef(new Map<string, string>());

  useEffect(() => {
    if (!activeHref) return;
    // The URL has to belong to this window and not merely start with it. A
    // document's URL passes through here while its list is still the active
    // window, and asking only whether the href matches let the list record it
    // as its own: coming back to the list then navigated to the document, and
    // opening the list reopened a document window that had been closed.
    if (findRoute(routes, pathname) !== activeHref) return;

    lastUrlByWindow.current.set(activeHref, currentUrl());
  }, [activeHref, pathname, routes]);

  // Until someone touches the initial state, the URL the page loaded with wins.
  // If it matched no route — a 404, say — navigating to `exitHref` would drag
  // the visitor off a page they did want to see.
  const initialWindows = useRef(openWindows);

  // The URL follows the active window. `replace` and not `push` because
  // focusing a window isn't navigating: it would fill the history and the back
  // button would walk through every focus change instead of the pages visited.
  useEffect(() => {
    if (openWindows === initialWindows.current) return;

    const target = activeWindowId
      ? (lastUrlByWindow.current.get(activeWindowId) ?? activeHref ?? exitHref)
      : exitHref;

    if (target !== currentUrl()) router.replace(target);
  }, [openWindows, activeWindowId, activeHref, exitHref, router]);

  return (
    <Desktop
      {...props}
      onOpenWindowsChange={setOpenWindows}
      openWindows={openWindows}
    >
      <RouteWindowOpener />
      {children}
    </Desktop>
  );
}

/**
 * Opens the window the URL belongs to. It renders nothing and exists only to
 * be inside `Desktop`, which is where `openWindow` lives.
 *
 * Each app used to do this for itself, from `useWindowRoute`. That worked while
 * every window was declared up front and could therefore recognize its own URL,
 * and it can't work for a pattern: the window for `/documents/violin.avif` has
 * no app mounted until it's open, so there was nobody to notice the URL was its
 * own. Landing on a route opens its window; it deliberately doesn't close on
 * the way out, since focusing another window changes the URL and has no
 * business closing this one.
 */
function RouteWindowOpener() {
  const { routes } = useWindowRoutes();
  const { openWindow } = useDesktop();
  const pathname = usePathname();

  const href = findRoute(routes, pathname);

  useEffect(() => {
    if (href) openWindow(href);
  }, [href, openWindow]);

  return null;
}

/**
 * Optional adapter: DayOS knows nothing about routes, so this module is the
 * only piece that talks to Next. Apps that don't use it keep working exactly as
 * before, without URLs.
 *
 * The href comes from the id of the `DesktopApp` containing it, which is the
 * route itself.
 */
export function useWindowRoute() {
  const app = useOptionalDesktopApp();
  const href = app?.id;

  const { routes } = useWindowRoutes();
  const pathname = usePathname();

  // The same match that seeds the open window and that `RouteWindowOpener`
  // uses, for the same reason: a URL belongs to exactly one window. Asking
  // whether this href merely prefixes the pathname let a route and its subroute
  // both claim `/docs/api`, so the parent stopped showing its own page and
  // mirrored its child's.
  const isCurrentRoute = href ? findRoute(routes, pathname) === href : false;

  const routeContent = useContext(RouteContentContext);

  // Holding on to the node isn't enough to preserve the content: what the
  // router hands over isn't content but a pointer to the active segment, so
  // re-rendering it paints the current route and every window ends up showing
  // the same thing. Alongside the node we store the router context that was in
  // place when this was the active route, and re-providing it makes the node
  // resolve back to its own segment instead of today's.
  const layoutRouter = useContext(LayoutRouterContext);

  const [snapshot, setSnapshot] = useState(() =>
    isCurrentRoute ? { node: routeContent, layoutRouter } : null,
  );

  // Adjusted during render and not in an effect: the window is already born
  // open when the URL belongs to it, so the content has to be ready in that
  // same render and not a frame later.
  if (isCurrentRoute && snapshot?.node !== routeContent) {
    setSnapshot({ node: routeContent, layoutRouter });
  }

  if (!href) {
    throw new Error(
      "useWindowRoute must be used within a DesktopApp with an explicit id",
    );
  }

  // While it's the current route it stays live, so navigating inside the window
  // keeps working; frozen only once focus has moved to another window.
  if (isCurrentRoute) return routeContent;
  if (!snapshot) return null;

  return (
    <LayoutRouterContext value={snapshot.layoutRouter}>
      {snapshot.node}
    </LayoutRouterContext>
  );
}

/**
 * The windows a pattern has open right now, so the app can render one
 * `DesktopApp` per instance:
 *
 * ```tsx
 * {useDynamicWindows("/documents/:file").map(({ href, params }) => (
 *   <DocumentApp file={params.file} href={href} key={href} />
 * ))}
 * ```
 *
 * A pattern is declared once and stands for as many windows as URLs visited, so
 * the app can't spell them out the way it does the static ones. The list comes
 * from the open windows and not from state of the app's own: the desktop
 * already knows which documents are open, and a second copy of that would be
 * one more thing to keep in sync.
 *
 * `params` comes along because the matching already worked it out, and without
 * it every caller would take the href apart again to get back what the pattern
 * had just told it.
 *
 * Only the windows the pattern itself claims are returned, so declaring
 * `/documents/new` alongside `/documents/:file` keeps that one out of the list
 * — its window is the specific route's, not an instance of the pattern.
 */
export function useDynamicWindows(pattern: string) {
  const { routes, openWindows } = useWindowRoutes();

  return useMemo(
    () =>
      openWindows.flatMap((id) => {
        const resolved = resolveRoute(routes, id);

        if (resolved?.route !== pattern || resolved.href !== id) return [];

        return [{ href: id, params: resolved.params }];
      }),
    [openWindows, pattern, routes],
  );
}
