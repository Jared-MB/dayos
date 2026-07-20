// The whole core is client-side: it uses context, effects and portals. The
// directive goes here too because the bundle takes it from the entry, and
// without it the published package loses it even though every source file has
// one.
"use client";

export {
  Desktop,
  DesktopApp,
  type DesktopAppProps,
  DesktopIcon,
  type DesktopIconProps,
  DesktopIconText,
  type DesktopIconTextProps,
  type DesktopProps,
  useDesktop,
  useDesktopApp,
  useOptionalDesktopApp,
} from "./desktop";
// Composition: anyone wrapping a DayOS component with `render` needs the type,
// so it's part of the public API even though the rest of `utils` isn't.
export type { RenderProp } from "./utils";
export {
  Window,
  WindowAction,
  type WindowActionProps,
  WindowActions,
  type WindowActionsProps,
  WindowClose,
  WindowContent,
  type WindowContentProps,
  WindowExpand,
  type WindowExpandProps,
  WindowHeader,
  type WindowHeaderProps,
  WindowName,
  type WindowNameProps,
  type WindowProps,
  windowRect,
} from "./window";
