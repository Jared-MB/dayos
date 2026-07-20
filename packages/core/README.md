# @dayos/core

A desktop with draggable windows for React: icons, windows you can move, resize
and maximize, and a focus stack.

React only — no dependency on Next or on any router. It brings no styles of its
own: the only CSS it sets is structural (the desktop is `relative` +
`overflow: hidden`, the window is a flex column), and everything else is yours.

```sh
npm install @dayos/core
```

## Usage

```tsx
import {
  Desktop,
  DesktopApp,
  DesktopIcon,
  Window,
  WindowContent,
  WindowHeader,
  WindowName,
} from "@dayos/core";

<Desktop className="h-dvh">
  <DesktopApp id="notes">
    <DesktopIcon>Notes</DesktopIcon>
    <Window>
      <WindowHeader>
        <WindowName>Notes</WindowName>
      </WindowHeader>
      <WindowContent>Hello</WindowContent>
    </Window>
  </DesktopApp>
</Desktop>;
```

Double click on an icon opens its window (<kbd>Enter</kbd> and <kbd>Space</kbd>
work too). Drag the `WindowHeader` to move the window, its edges to resize it.

## Components

| | |
| --- | --- |
| `Desktop` | The container. Owns the open windows and their stacking order. |
| `DesktopApp` | One app: an icon plus a window, tied together by an `id`. |
| `DesktopIcon`, `DesktopIconText` | What opens the window. |
| `Window` | The window frame. Portals into the desktop once it's mounted. |
| `WindowHeader`, `WindowName` | The title bar, which is also the drag handle. |
| `WindowContent` | The scrollable body. |
| `WindowActions`, `WindowAction` | The control group and a generic button. |
| `WindowExpand`, `WindowClose` | Maximize/restore and close. |

Hooks: `useDesktop`, `useDesktopApp`, `useOptionalDesktopApp`.

## Composition

Every component takes `className` and `style`, and a `render` prop that swaps
out the element it emits while keeping the behavior:

```tsx
<DesktopIcon render={<Link href="/notes" />}>Notes</DesktopIcon>
```

Your handlers run before the built-in ones and can cancel them with
`preventDefault()`.

## Controlling the desktop

`Desktop` works uncontrolled (`defaultOpenWindows`) or controlled
(`openWindows` + `onOpenWindowsChange`), so window state can be persisted or
driven from a dock. `DesktopApp` takes the same pair per window (`defaultOpen`,
`open` + `onOpenChange`).

## Server rendering

A window that is open during the server render lands in the HTML with its
content inside, without `react-rnd` and with its geometry in CSS — sized and
positioned to match exactly where it will sit once mounted, so there's no jump
on hydration.

Only `Desktop`'s `defaultOpenWindows` seeds that: `DesktopApp`'s `defaultOpen`
runs in an effect, so it opens the window on the client only.

## Routing

The core knows nothing about URLs. To give each window a route on the Next App
Router, add [`@dayos/next`](https://github.com/Jared-MB/dayos/tree/main/packages/next#readme).

## License

MIT
