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

/** A window owns its subroutes too: `/docs` covers `/docs/api`. */
const matchesRoute = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * Longest match wins: with `/docs` and `/docs/api` both declared, landing on
 * `/docs/api` opens the specific window and not the one containing it.
 */
const findRoute = (routes: readonly string[], pathname: string) =>
  [...routes]
    .sort((a, b) => b.length - a.length)
    .find((href) => matchesRoute(pathname, href));

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
  exitHref = "/",
  ...props
}: RoutedDesktopProps) {
  const { routes, openWindows, setOpenWindows } = useWindowRoutes();
  const router = useRouter();
  const pathname = usePathname();

  const activeWindowId = openWindows.at(-1);

  // Not every app is routed: one that opens an external link has a generated id
  // and no URL of its own.
  const activeHref =
    activeWindowId && routes.includes(activeWindowId)
      ? activeWindowId
      : undefined;

  // Each window's last real URL, query and hash included. Storing just the
  // `href` would mean returning to a window wipes the params it had.
  const lastUrlByWindow = useRef(new Map<string, string>());

  useEffect(() => {
    if (!activeHref) return;
    if (!matchesRoute(pathname, activeHref)) return;

    lastUrlByWindow.current.set(activeHref, currentUrl());
  }, [activeHref, pathname]);

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
      openWindows={openWindows}
      onOpenWindowsChange={setOpenWindows}
    />
  );
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

  const { openWindow } = useDesktop();
  const pathname = usePathname();

  // Landing on the route opens the window; that's what makes the link
  // shareable. It deliberately doesn't close on the way out: focusing another
  // window changes the URL and has no business closing this one. It depends on
  // the comparison and not on the open windows so that closing it doesn't fire
  // the effect again and reopen it.
  const isCurrentRoute = href ? matchesRoute(pathname, href) : false;

  useEffect(() => {
    if (isCurrentRoute && href) openWindow(href);
  }, [isCurrentRoute, href, openWindow]);

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
