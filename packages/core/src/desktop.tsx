"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  mergeProps,
  type RenderProp,
  renderSlot,
  useControllableState,
} from "./utils";

export type CloseWindowOptions = {
  /**
   * Keeps the window mounted and hidden instead of unmounting it, so its state
   * survives until it opens again: a minimize. It applies to this close only;
   * for a window that should always survive closing, use the `Window`'s
   * `keepMounted` prop.
   */
  keepMounted?: boolean;
};

type DesktopContextType = {
  /**
   * The desktop node. It's `null` on the first render and gets populated on
   * mount, which is why it's state and not a ref: consumers need to re-render
   * once it shows up (to portal into it, for instance).
   */
  desktopEl: HTMLDivElement | null;
  /** Open windows in stacking order; the last one is the one in front. */
  openWindows: string[];
  activeWindowId?: string;
  /**
   * Windows closed on purpose with `keepMounted` (`WindowMinimize`, or a
   * `close({ keepMounted: true })`): hidden, with their state alive. A window
   * leaves the list once it opens again or gets a plain close, which unmounts
   * it.
   */
  minimizedWindows: string[];
  /**
   * Each window's name, keyed by id: the text of its `WindowName`. Only
   * windows that are mounted have one, so a minimized window keeps its name
   * and a closed one doesn't.
   */
  windowNames: Record<string, string>;
  openWindow: (id: string) => void;
  closeWindow: (id: string, options?: CloseWindowOptions) => void;
  focusWindow: (id: string) => void;
  /** Some window is being dragged or resized right now. */
  isInteracting: boolean;
  setInteracting: (interacting: boolean) => void;
};

const DesktopContext = createContext<DesktopContextType | null>(null);

export const useDesktop = () => {
  const context = useContext(DesktopContext);

  if (!context)
    throw new Error("useDesktop must be used within a DesktopProvider");

  return context;
};

const moveToFront = (windows: string[], id: string) => [
  ...windows.filter((w) => w !== id),
  id,
];

/**
 * Id registry, only there to warn about duplicates in development. It lives in
 * its own context rather than in `DesktopContext` so it doesn't add noise to
 * the API `useDesktop` callers see.
 */
const AppRegistryContext = createContext<((id: string) => () => void) | null>(
  null,
);

/**
 * Closed windows that were closed with `keepMounted`. Internal for the same
 * reason as the registry: only `Window` reads it.
 */
const KeptWindowsContext = createContext<string[]>([]);

export const useIsWindowKept = (id: string) =>
  useContext(KeptWindowsContext).includes(id);

/**
 * Where `WindowName` reports its text. Internal for the same reason as the
 * registry: only `WindowName` writes to it. `undefined` removes the name.
 */
const SetWindowNameContext = createContext<
  (id: string, name: string | undefined) => void
>(() => {});

export const useSetWindowName = () => useContext(SetWindowNameContext);

const withName = (
  names: Record<string, string>,
  id: string,
  name: string | undefined,
) => {
  // Same reference when nothing changed, so React drops the update.
  if (names[id] === name) return names;
  if (name !== undefined) return { ...names, [id]: name };

  const { [id]: _removed, ...rest } = names;
  return rest;
};

export type DesktopProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ReactNode;
  /** Shorthand for painting a background; same as `style.backgroundImage`. */
  wallpaper?: string;
  /** Open windows when the desktop is driven from outside. */
  openWindows?: string[];
  defaultOpenWindows?: string[];
  onOpenWindowsChange?: (openWindows: string[]) => void;
  render?: RenderProp<React.ComponentProps<"div">>;
};

/**
 * DayOS imposes no layout: the desktop is a single positioned container, and
 * the grid (or free flow, or a dock) is up to whoever uses it, via `className`.
 * The only structural bits are `relative` + `overflow-hidden`, which windows
 * need in order to position and clip against it.
 */
export function Desktop({
  children,
  wallpaper,
  style,
  openWindows: openWindowsProp,
  defaultOpenWindows,
  onOpenWindowsChange,
  render,
  ref,
  ...props
}: DesktopProps) {
  const [desktopEl, setDesktopEl] = useState<HTMLDivElement | null>(null);
  const [isInteracting, setInteracting] = useState(false);

  const [openWindows, setOpenWindows] = useControllableState<string[]>({
    value: openWindowsProp,
    defaultValue: defaultOpenWindows ?? [],
    onChange: onOpenWindowsChange,
  });

  const openWindow = useCallback(
    (id: string) => setOpenWindows((prev) => moveToFront(prev, id)),
    [setOpenWindows],
  );

  const [keptWindows, setKeptWindows] = useState<string[]>([]);

  const closeWindow = useCallback(
    (id: string, options?: CloseWindowOptions) =>
      setOpenWindows((prev) => {
        const keep = options?.keepMounted === true;

        // Already closed. A plain close still finishes off a minimized window
        // (a taskbar's close, for instance), but a `keepMounted` one mustn't
        // bring a closed window back as a hidden mount.
        if (!prev.includes(id)) {
          if (!keep)
            setKeptWindows((kept) =>
              kept.includes(id) ? kept.filter((w) => w !== id) : kept,
            );
          return prev;
        }

        // Inside the updater because that's the only place that knows whether
        // the window was actually open. `useControllableState` runs the
        // updater synchronously, so this is a plain call and not a side effect
        // inside a React updater.
        setKeptWindows((kept) =>
          kept.includes(id) === keep
            ? kept
            : keep
              ? [...kept, id]
              : kept.filter((w) => w !== id),
        );

        return prev.filter((w) => w !== id);
      }),
    [setOpenWindows],
  );

  // An open window isn't kept: the flag belongs to the close that set it. It's
  // dropped by watching the state rather than inside `openWindow` because a
  // controlled desktop can reopen a window without going through it, and a
  // stale flag would keep the next close mounted too.
  useEffect(() => {
    setKeptWindows((kept) => {
      const next = kept.filter((w) => !openWindows.includes(w));
      return next.length === kept.length ? kept : next;
    });
  }, [openWindows]);

  const [windowNames, setWindowNames] = useState<Record<string, string>>({});

  const setWindowName = useCallback(
    (id: string, name: string | undefined) =>
      setWindowNames((names) => withName(names, id, name)),
    [],
  );

  const focusWindow = useCallback(
    (id: string) =>
      setOpenWindows((prev) =>
        // Returning the same reference makes React drop the update, so clicking
        // the window that's already in front re-renders nothing.
        prev.at(-1) === id || !prev.includes(id) ? prev : moveToFront(prev, id),
      ),
    [setOpenWindows],
  );

  const value = useMemo(
    () => ({
      desktopEl,
      openWindows,
      activeWindowId: openWindows.at(-1),
      minimizedWindows: keptWindows,
      windowNames,
      openWindow,
      closeWindow,
      focusWindow,
      isInteracting,
      setInteracting,
    }),
    [
      desktopEl,
      openWindows,
      keptWindows,
      windowNames,
      openWindow,
      closeWindow,
      focusWindow,
      isInteracting,
    ],
  );

  // How many mounted `DesktopApp`s claim each id. It's a counter and not a Set
  // because StrictMode mounts, unmounts and mounts again in development: with a
  // Set the second mount would look like a duplicate and warn for nothing.
  const appCounts = useRef(new Map<string, number>());

  const registerApp = useCallback((id: string) => {
    const counts = appCounts.current;
    const count = (counts.get(id) ?? 0) + 1;
    counts.set(id, count);

    if (count > 1) {
      console.error(
        `DayOS: duplicate DesktopApp id ${JSON.stringify(id)}. An id identifies ` +
          `one window, so both apps share it and render the same window twice, ` +
          `stacked exactly on top of each other. Give each app its own id.`,
      );
    }

    return () => {
      const current = counts.get(id) ?? 0;
      if (current > 1) counts.set(id, current - 1);
      else counts.delete(id);
    };
  }, []);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDesktopEl(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const elementProps = mergeProps(
    {
      ref: setRefs,
      // The only styles DayOS imposes, and only because they're structural:
      // windows position against the desktop and clip against it. Size, grid
      // and background are the consumer's call.
      style: {
        position: "relative",
        overflow: "hidden",
        ...(wallpaper
          ? {
              backgroundImage: `url(${wallpaper})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : null),
      } satisfies React.CSSProperties,
      // A drag or resize is in progress. An iframe swallows the `mousemove` and
      // `mouseup` the drag listens for on the `document`: the moment the cursor
      // crosses one, the window either stalls or stays stuck to the pointer
      // because the `mouseup` never arrived. Disabling pointer events for the
      // duration fixes it, but that's a rule about descendants and it can't be
      // written in an inline `style`, so the consumer writes it:
      //
      //   [&[data-interacting]_iframe]:pointer-events-none
      "data-interacting": isInteracting ? "" : undefined,
      children,
    },
    { ...props, style },
  );

  return (
    <DesktopContext value={value}>
      <AppRegistryContext value={registerApp}>
        <KeptWindowsContext value={keptWindows}>
          <SetWindowNameContext value={setWindowName}>
            {renderSlot(render, elementProps, (finalProps) => (
              <div {...(finalProps as React.ComponentProps<"div">)} />
            ))}
          </SetWindowNameContext>
        </KeptWindowsContext>
      </AppRegistryContext>
    </DesktopContext>
  );
}

type DesktopAppContextType = {
  id: string;
  isWindowOpen: boolean;
  open: () => void;
  /**
   * Also takes an event so `onClick={close}` keeps working: an event isn't
   * options, and the close goes through as a plain one.
   */
  close: (options?: CloseWindowOptions | React.SyntheticEvent) => void;
  focus: () => void;
};

const DesktopAppContext = createContext<DesktopAppContextType | null>(null);

export type DesktopAppProps = {
  children: React.ReactNode;
  id?: string;
  /**
   * Opens the window on mount. Never touches it again after that.
   *
   * It runs in an effect, so the window doesn't exist in the server HTML: an
   * app can seed itself but not the desktop's initial state, which belongs to
   * its parent. To have a window come open from the server, declare it in the
   * `Desktop`'s `defaultOpenWindows`.
   */
  defaultOpen?: boolean;
  /** Controlled state: keeps the window in sync with this value. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DesktopApp({
  children,
  id: desktopAppId,
  defaultOpen = false,
  open,
  onOpenChange,
}: DesktopAppProps) {
  const hookId = useId();
  const id = desktopAppId ?? hookId;

  const { openWindows, openWindow, closeWindow, focusWindow } = useDesktop();
  const isWindowOpen = openWindows.includes(id);

  // Two apps with the same id share window state and neither one fails: both
  // open, both portal and both land in the same spot, so it looks like a single
  // window with the wrong content. The warning turns that into something
  // diagnosable. Development only, where there's someone around to read it.
  const registerApp = useContext(AppRegistryContext);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    return registerApp?.(id);
  }, [id, registerApp]);

  const hasAppliedDefault = useRef(false);

  useEffect(() => {
    if (hasAppliedDefault.current) return;
    hasAppliedDefault.current = true;
    if (defaultOpen) openWindow(id);
  }, [defaultOpen, id, openWindow]);

  // Controlled mode: the prop wins over the desktop's state, so closing from
  // outside actually closes (unlike `defaultOpen`, which only seeds).
  useEffect(() => {
    if (open === undefined) return;
    if (open && !isWindowOpen) openWindow(id);
    if (!open && isWindowOpen) closeWindow(id);
  }, [open, isWindowOpen, id, openWindow, closeWindow]);

  // Fires wherever the change came from (a button, a route, a shortcut, another
  // window), which is why it watches the state instead of wrapping
  // `open`/`close`.
  const wasWindowOpen = useRef(isWindowOpen);

  useEffect(() => {
    if (wasWindowOpen.current === isWindowOpen) return;
    wasWindowOpen.current = isWindowOpen;
    onOpenChange?.(isWindowOpen);
  }, [isWindowOpen, onOpenChange]);

  const value = useMemo(
    () => ({
      id,
      isWindowOpen,
      open: () => openWindow(id),
      close: (options?: CloseWindowOptions | React.SyntheticEvent) =>
        closeWindow(
          id,
          options && "keepMounted" in options ? options : undefined,
        ),
      focus: () => focusWindow(id),
    }),
    [id, isWindowOpen, openWindow, closeWindow, focusWindow],
  );

  return <DesktopAppContext value={value}>{children}</DesktopAppContext>;
}

export function useDesktopApp() {
  const context = useContext(DesktopAppContext);

  if (!context)
    throw new Error("useDesktopApp must be used within a DesktopAppProvider");

  return context;
}

/** Variant that doesn't throw outside the provider, for optional adapters. */
export function useOptionalDesktopApp() {
  return useContext(DesktopAppContext);
}

export type DesktopIconProps = React.ComponentProps<"button"> & {
  render?: RenderProp<React.ComponentProps<"button">>;
};

export function DesktopIcon({
  render,
  children,
  onDoubleClick,
  onKeyDown,
  ...props
}: DesktopIconProps) {
  const { open } = useDesktopApp();

  const elementProps = mergeProps({ type: "button", children }, props);

  // We compose instead of overriding: the consumer's handlers run first and can
  // cancel the open with `preventDefault()`.
  const handleDoubleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onDoubleClick?.(event);
    if (!event.defaultPrevented) open();
  };

  // Double click doesn't exist for the keyboard: without this the icon is
  // unreachable unless it carries a navigable `render` that opens the window by
  // route.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    open();
  };

  const withHandlers = mergeProps(elementProps, {
    onDoubleClick: handleDoubleClick,
    onKeyDown: handleKeyDown,
  });

  return renderSlot(render, withHandlers, (finalProps) => (
    <button {...(finalProps as React.ComponentProps<"button">)} />
  ));
}

export type DesktopIconTextProps = React.ComponentProps<"span"> & {
  render?: RenderProp<React.ComponentProps<"span">>;
};

export function DesktopIconText({
  render,
  children,
  ...props
}: DesktopIconTextProps) {
  const elementProps = mergeProps({ children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <span {...(finalProps as React.ComponentProps<"span">)} />
  ));
}
