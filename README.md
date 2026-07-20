# DayOS

A desktop with draggable windows for React: icons, windows you can move, resize
and maximize, and a focus stack. No styling of its own and no knowledge of
routes — what it looks like is up to whoever uses it.

## Packages

| Package | What it is |
| --- | --- |
| [`@dayos/core`](packages/core) | The library. React only: no dependency on Next or on any router. |
| [`@dayos/next`](packages/next) | Optional adapter for the Next App Router: every window gets its own URL. |

`@dayos/core` stands on its own and isn't missing anything: without the adapter
the desktop works just the same, on a single page and without URLs. The
[`routeless.test.tsx`](packages/core/src/routeless.test.tsx) suite exists so
that doesn't break by accident.

`@dayos/next` is the only piece that talks to Next, and server rendering is its
whole reason to exist: it seeds the open windows from the URL during the same
render, so the server HTML already carries the right window with its content
inside instead of an empty desktop.

## Usage

```tsx
import { Desktop, DesktopApp, DesktopIcon, Window, WindowContent } from "@dayos/core";

<Desktop className="h-dvh">
  <DesktopApp id="notes">
    <DesktopIcon>Notes</DesktopIcon>
    <Window>
      <WindowContent>Hello</WindowContent>
    </Window>
  </DesktopApp>
</Desktop>;
```

Every component accepts `className`, `style` and a `render` prop that replaces
the element it emits while keeping the behavior. The only styles DayOS imposes
are structural: the desktop is `relative` + `overflow: hidden`, and the window
is a flex column.

## This repo

```
apps/web         Demo of both pieces: desktop, windows and URLs.
packages/core    @dayos/core
packages/next    @dayos/next
```

```sh
pnpm install
pnpm dev          # demo at http://localhost:3000
pnpm test         # vitest across both packages
pnpm check-types
pnpm lint         # biome
```

The adapter's tests resolve `@dayos/core` against the source rather than its
`dist`, so no build is needed to run them. `check-types` and `build` do depend
on the core's build, and turbo chains that for you.

`main` takes no direct pushes: every commit needs a green `ci` check, so work
goes through a branch. Cutting a release is [RELEASING.md](RELEASING.md).
