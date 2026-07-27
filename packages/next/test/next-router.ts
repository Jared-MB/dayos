import { vi } from "vitest";

/**
 * A Next router for tests. It actually navigates `window.location` instead of
 * just recording the call: `@dayos/next` decides whether to navigate by
 * comparing the target against the current URL, so a `replace` that doesn't
 * move the URL would let tests pass that fail in a real browser.
 */
const listeners = new Set<() => void>();

type NavigateOptions = { scroll?: boolean };

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
  // The options are recorded but not acted on: jsdom has nothing to scroll, and
  // what the tests care about is that they were asked for.
  replace: vi.fn((url: string, _options?: NavigateOptions) => navigate(url)),
  push: vi.fn((url: string, _options?: NavigateOptions) => navigate(url)),
};

/**
 * Stable identity, like Next's router has. Returning a new object per render
 * makes every effect that depends on it run each time, and `RoutedDesktop` ends
 * up in an update loop that doesn't exist in a real app.
 */
export const router = {
  // The options go through as they came: what `replace` is asked to do besides
  // changing the URL — not scrolling, in particular — is part of the behavior
  // the tests are here to pin down.
  replace: (url: string, options?: NavigateOptions) =>
    routerState.replace(url, options),
  push: (url: string, options?: NavigateOptions) =>
    routerState.push(url, options),
};

/**
 * The URL of the last `replace`, for the tests whose subject is which URL the
 * desktop picks rather than how it navigates there. Asserting on the call
 * itself would make every one of them repeat the options too, and then a change
 * to the options would read as a change to all of them.
 */
export const lastReplacedUrl = () => routerState.replace.mock.lastCall?.[0];

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
