# @dayos/next

The [DayOS](https://github.com/Jared-MB/dayos) adapter for the Next App Router:
every window gets a URL of its own, and the server render puts each route's
content inside the window it belongs to.

```sh
npm install @dayos/core @dayos/next
```

## Why it exists

Without it, a desktop is a single page. With it:

- Requesting `/docs` returns HTML that **already has** the docs window open with
  its content inside — indexable, and no flash of an empty desktop.
- Focusing a window updates the URL (via `replace`, so the back button still
  walks pages and not focus changes), which makes windows shareable by link.
- A window that loses focus keeps showing its own content instead of the
  current route's.

## Usage

Two routes, `/` and `/about`. The layout hands the current page's content to
the provider:

```tsx
// app/layout.tsx
import { Shell } from "./shell";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
```

```tsx
// app/shell.tsx
"use client";

import { DesktopApp, DesktopIcon, Window, WindowContent } from "@dayos/core";
import { RoutedDesktop, useWindowRoute, WindowRouteProvider } from "@dayos/next";

const ROUTES = ["/", "/about"] as const;

function App({ href }: { href: string }) {
  return (
    <DesktopApp id={href}>
      <AppShell href={href} />
    </DesktopApp>
  );
}

function AppShell({ href }: { href: string }) {
  // The content of this window's route, frozen when focus moves elsewhere.
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>{href}</DesktopIcon>
      <Window>
        <WindowContent>{content}</WindowContent>
      </Window>
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <WindowRouteProvider content={children} routes={ROUTES}>
      <RoutedDesktop>
        {ROUTES.map((href) => (
          <App href={href} key={href} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>
  );
}
```

A window's `href` **is** its `DesktopApp` id — one identity, declared once.

## API

| | |
| --- | --- |
| `WindowRouteProvider` | Takes the layout's `children` as `content` and every route up front. Seeds the open window from the URL during render, which is what gets it into the server HTML. |
| `RoutedDesktop` | `Desktop` with its window state delegated to the provider. Also the sole owner of the window → URL sync. |
| `useWindowRoute()` | Returns the content of the containing app's route. Live while it's the current route, frozen once focus moves away. |
| `useDynamicWindows(pattern)` | The windows a dynamic route has open right now, as `{ href, params }`. |

`RoutedDesktop` accepts everything `Desktop` does except the window-state props,
plus `exitHref` (default `"/"`) — where the URL goes when the last window
closes.

## Dynamic routes

A route segment written `:like-this` matches anything, and the window is
identified by the URL it matched — so one declaration stands for a window per
document:

```tsx
const ROUTES = ["/", "/documents", "/documents/:file"];
```

The app can't spell those windows out the way it does the static ones, so it
asks the desktop which are open:

```tsx
function DocumentApps() {
  return useDynamicWindows("/documents/:file").map(({ href, params }) => (
    <DesktopApp id={href} key={href}>
      <DocumentShell file={params.file} />
    </DesktopApp>
  ));
}
```

Nothing else is needed: an ordinary `<Link href="/documents/violin.avif">` opens
the document's window beside the list, and a visitor landing on that URL gets it
in the server HTML.

`params` is what the pattern filled in, decoded the way a Next page's own
`params` are, so a window gets `sheet music.avif` and not `sheet%20music.avif`.
The `href` keeps the URL's spelling — it's the window's identity.

Declaring the pattern is what asks for a window per document. Leaving it out
isn't a missing feature but the other reasonable behavior — `/documents` covers
its subroutes, so the document opens *inside* the list's window and navigating
there is navigating within it.

## Notes

Routes are matched a segment at a time, most specific first: more segments win,
and at the same depth a static segment beats a param. With `/docs`, `/docs/api`
and `/docs/:page` declared, `/docs/api` opens the specific window, `/docs/setup`
opens the param's, `/docs/a/b` opens `/docs/a`'s, and `/docsy` opens none. `/`
is the exception to covering subroutes: it matches only itself, or every URL on
the site would belong to the home window.

Not every app has to be routed. One with a generated id simply has no URL, and
the desktop treats it the same.

The adapter imports `LayoutRouterContext` from Next's internals — the price of
keeping per-window content without parallel routes. A Next update that moves
that module breaks the build loudly rather than silently.

## License

MIT
