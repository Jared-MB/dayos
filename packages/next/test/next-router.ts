import { vi } from "vitest";

/**
 * A Next router for tests. It actually navigates `window.location` instead of
 * just recording the call: `@dayos/next` decides whether to navigate by
 * comparing the target against the current URL, so a `replace` that doesn't
 * move the URL would let tests pass that fail in a real browser.
 */
const listeners = new Set<() => void>();

let pathname = "/";

function navigate(url: string) {
  window.history.replaceState(null, "", url);
  // `usePathname` includes neither query nor hash; those live only in
  // `location`.
  pathname = url.split(/[?#]/)[0] ?? url;
  for (const notify of listeners) notify();
}

export const routerState = {
  get pathname() {
    return pathname;
  },
  replace: vi.fn(navigate),
  push: vi.fn(navigate),
};

/**
 * Stable identity, like Next's router has. Returning a new object per render
 * makes every effect that depends on it run each time, and `RoutedDesktop` ends
 * up in an update loop that doesn't exist in a real app.
 */
export const router = {
  replace: (url: string) => routerState.replace(url),
  push: (url: string) => routerState.push(url),
};

export const subscribePathname = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getPathname = () => pathname;

/** Drops the visitor on a URL before mounting, as if they'd landed there. */
export function setLocation(url: string) {
  navigate(url);
  routerState.replace.mockClear();
  routerState.push.mockClear();
}

export function resetRouter() {
  listeners.clear();
  setLocation("/");
}
