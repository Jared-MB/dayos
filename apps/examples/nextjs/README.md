# Next.js example

The demo desktop, built with [`@dayos/core`](../../../packages/core) and the
App Router adapter [`@dayos/next`](../../../packages/next). It's the example
that shows the whole thing: icons, windows you can move, resize and maximize,
and a URL that follows the front window so any arrangement is a shareable link.

```sh
pnpm install                                    # once, from the repo root
pnpm exec turbo dev --filter=example-nextjs     # http://localhost:3000
```

Plain `pnpm dev` from the root starts this app alongside the docs site. Either
way turbo builds `@dayos/core` and `@dayos/next` first, so there's nothing to
build by hand.

## What's in here

```
app/layout.tsx        Passes the route's content into <Shell> as a prop.
app/shell.tsx         The desktop: which windows exist and what they look like.
app/globals.css       Every style you see. DayOS ships none of them.
app/about, documents, projects
                      Ordinary App Router pages, unaware of the desktop.
```

The interesting file is [`app/shell.tsx`](app/shell.tsx). Everything else is a
plain Next app: the pages don't import DayOS and don't know they're rendered
inside a window.

## The two things worth reading

**The content comes in as a prop, not as a child.** `layout.tsx` hands the
route's `children` to `WindowRouteProvider` instead of rendering it in place,
and the window that owns the current route claims it from the inside. That's
what makes the server HTML arrive with the right window already open and filled
in, rather than an empty desktop that fills itself after hydration.

**Routes are declared, and some of them are patterns.** `ROUTES` lists what the
desktop can open. A literal like `/about` is one window; a pattern like
`/documents/:file` stands for one window per URL visited, rendered from
`useDynamicWindows` — the desktop keeps the list, so opening one is an ordinary
`<Link>`. Projects nest three deep with a static route beside the dynamic one at
each level (`/projects/archive` against `/projects/:project`), which is there to
show that the more specific route wins.

## Styling

None of it comes from DayOS. The library imposes only structure — the desktop is
`relative` + `overflow: hidden`, the window is a flex column — and everything
else in `globals.css` is this app's choice, including the light and dark
palettes. Every component takes `className`, `style` and a `render` prop, so a
different look is a matter of passing different classes, not of overriding
anything.
