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

`RoutedDesktop` accepts everything `Desktop` does except the window-state props,
plus `exitHref` (default `"/"`) — where the URL goes when the last window
closes.

## Notes

Routes are matched by longest prefix on whole segments: with `/docs` and
`/docs/api` both declared, `/docs/api` opens the specific window, `/docs/setup`
opens `/docs`, and `/docsy` opens neither.

Not every app has to be routed. One with a generated id simply has no URL, and
the desktop treats it the same.

The adapter imports `LayoutRouterContext` from Next's internals — the price of
keeping per-window content without parallel routes. A Next update that moves
that module breaks the build loudly rather than silently.

## License

MIT
