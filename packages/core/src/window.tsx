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
import { createPortal } from "react-dom";
import { Rnd, type RndDragEvent } from "react-rnd";
import { useDesktop, useDesktopApp } from "./desktop";
import { cn, mergeProps, type RenderProp, renderSlot } from "./utils";

const DEFAULT_CASCADE_OFFSET = 32;
const DEFAULT_SIZE_RATIO = 0.7;

type Rect = { x: number; y: number; width: number; height: number };

/**
 * Where a freshly opened window goes, in px. It's the only initial-position
 * math there is: `StaticWindowFrame` expresses it in CSS because the server
 * doesn't know the viewport, and if the two versions drift apart the window
 * jumps on hydration. It lives free and pure so a test can compare them.
 */
export function windowRect({
  desktopWidth,
  desktopHeight,
  defaultSize,
  defaultPosition,
  cascadeStep = 0,
  cascadeOffset = DEFAULT_CASCADE_OFFSET,
}: {
  desktopWidth: number;
  desktopHeight: number;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  cascadeStep?: number;
  cascadeOffset?: number;
}): Rect {
  const width = Math.min(
    defaultSize?.width ?? desktopWidth * DEFAULT_SIZE_RATIO,
    desktopWidth,
  );
  const height = Math.min(
    defaultSize?.height ?? desktopHeight * DEFAULT_SIZE_RATIO,
    desktopHeight,
  );

  if (defaultPosition) return { width, height, ...defaultPosition };

  const maxX = Math.max(0, desktopWidth - width);
  const maxY = Math.max(0, desktopHeight - height);

  // The modulo keeps the nth window from landing off screen: the cascade wraps
  // around and starts over at the top left.
  const step = cascadeStep * cascadeOffset;
  const cascadeX = maxX > 0 ? step % maxX : 0;
  const cascadeY = maxY > 0 ? step % maxY : 0;

  return {
    width,
    height,
    x: Math.min((desktopWidth - width) / 2 + cascadeX, maxX),
    y: Math.min((desktopHeight - height) / 2 + cascadeY, maxY),
  };
}

/**
 * Shared by both frames: if they drift apart, the server window and the real
 * one lay out differently and the swap on hydration reads as a jump.
 */
const WINDOW_BODY_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

type WindowFrameContextType = {
  isMaximized: boolean;
  toggleMaximize: () => void;
  /** The `WindowName` id, to hang the dialog's accessible name off. */
  titleId: string;
};

const WindowFrameContext = createContext<WindowFrameContextType | null>(null);

const useWindowFrame = () => {
  const context = useContext(WindowFrameContext);

  if (!context) throw new Error("useWindowFrame must be used within a Window");

  return context;
};

export type WindowProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Initial size in px. Defaults to 70% of the desktop. */
  defaultSize?: { width: number; height: number };
  /** Initial position in px. Defaults to centered, cascading per window. */
  defaultPosition?: { x: number; y: number };
  minWidth?: number;
  minHeight?: number;
  cascadeOffset?: number;
  /**
   * Keeps the window mounted when it's closed. Without this, closing unmounts
   * the subtree and all of its state goes with it (scroll, forms, playback).
   */
  keepMounted?: boolean;
  closeOnEscape?: boolean;
  /**
   * Selector for elements that don't start a drag. Defaults to the header
   * controls: without it, hitting "restore" also starts a drag and the window
   * ends up stuck to the cursor instead of returning to its saved position.
   */
  dragCancel?: string;
};

export function Window({ keepMounted = false, ...props }: WindowProps) {
  const { desktopEl } = useDesktop();
  const { isWindowOpen } = useDesktopApp();

  // With `keepMounted` the window mounts the first time it opens and not
  // before: mounting them all up front would pay for rendering apps that may
  // never be used.
  const [hasBeenOpen, setHasBeenOpen] = useState(isWindowOpen);

  useEffect(() => {
    if (isWindowOpen) setHasBeenOpen(true);
  }, [isWindowOpen]);

  const shouldMount = keepMounted ? hasBeenOpen : isWindowOpen;

  if (!shouldMount) return null;

  // With no desktop mounted — the server render and the hydration render, where
  // `desktopEl` is null in both — the window renders in place in the tree and
  // without `Rnd`: portals don't exist on the server, and rendering here is
  // what puts the open window into the HTML. The browser paints that markup
  // long before React runs, so CSS resolves its geometry.
  if (!desktopEl) return <StaticWindowFrame {...props} />;

  return createPortal(
    <WindowFrame {...props} desktopEl={desktopEl} hidden={!isWindowOpen} />,
    desktopEl,
  );
}

/**
 * The window before there's a desktop to measure: same accessible markup, no
 * dragging and no resizing. Its whole reason to exist is that the server HTML
 * carries the open window with its content inside.
 *
 * The geometry comes from CSS and not computed px because the server doesn't
 * know the viewport, and it's picked to land exactly where `Rnd` will place the
 * window on mount: centered, same size. If the two didn't line up, the swap
 * would read as a jump — which is exactly what happened back when this frame
 * came out in the corner.
 */
function StaticWindowFrame({
  children,
  className,
  style,
  defaultSize,
  defaultPosition,
}: Omit<WindowProps, "keepMounted">) {
  const titleId = useId();

  const frame = useMemo(
    () => ({ isMaximized: false, toggleMaximize: () => {}, titleId }),
    [titleId],
  );

  // `calc(50% - half)` centers a px size against a percentage container, which
  // is exactly the math `WindowFrame` does with `clientWidth`. Rounded because
  // the raw float comes out as `15.000000000000002%` in the DOM.
  const margin = `${Number((((1 - DEFAULT_SIZE_RATIO) / 2) * 100).toFixed(4))}%`;

  const geometry: React.CSSProperties = defaultSize
    ? {
        width: defaultSize.width,
        height: defaultSize.height,
        left: defaultPosition
          ? defaultPosition.x
          : `calc(50% - ${defaultSize.width / 2}px)`,
        top: defaultPosition
          ? defaultPosition.y
          : `calc(50% - ${defaultSize.height / 2}px)`,
      }
    : {
        width: `${DEFAULT_SIZE_RATIO * 100}%`,
        height: `${DEFAULT_SIZE_RATIO * 100}%`,
        left: defaultPosition ? defaultPosition.x : margin,
        top: defaultPosition ? defaultPosition.y : margin,
      };

  return (
    <div
      data-window=""
      className={className}
      style={{
        position: "absolute",
        // The clamp `WindowFrame` does against the desktop, in CSS: without it
        // a `defaultSize` in px overflows on small viewports.
        maxWidth: "100%",
        maxHeight: "100%",
        zIndex: 1,
        ...geometry,
        ...style,
      }}
    >
      <section
        role="dialog"
        aria-labelledby={titleId}
        aria-modal={false}
        tabIndex={-1}
        // Structural: the header and the content are one column, and that's
        // where the `flex-1` that scrolls the content instead of the whole
        // window comes from.
        style={WINDOW_BODY_STYLE}
      >
        <WindowFrameContext value={frame}>{children}</WindowFrameContext>
      </section>
    </div>
  );
}

function WindowFrame({
  children,
  desktopEl,
  className,
  style,
  defaultSize,
  defaultPosition,
  minWidth = 240,
  minHeight = 120,
  cascadeOffset = DEFAULT_CASCADE_OFFSET,
  closeOnEscape = true,
  dragCancel = "button, a, input, select, textarea",
  hidden,
}: Omit<WindowProps, "keepMounted"> & {
  desktopEl: HTMLDivElement;
  hidden: boolean;
}) {
  const { openWindows, focusWindow, setInteracting } = useDesktop();
  const { id, close } = useDesktopApp();
  const titleId = useId();

  // It only mounts on open, so the initial position is computed once with the
  // desktop's real measurements. `Rnd` ignores `default` after mount, which is
  // why there's no need to track desktop resizes here.
  const [defaultRect] = useState<Rect>(() =>
    windowRect({
      desktopWidth: desktopEl.clientWidth,
      desktopHeight: desktopEl.clientHeight,
      defaultSize,
      defaultPosition,
      cascadeStep: Math.max(0, openWindows.indexOf(id)),
      cascadeOffset,
    }),
  );

  const rndRef = useRef<Rnd>(null);
  // Holds the geometry from before maximizing; `null` means "not maximized".
  const [restoreRect, setRestoreRect] = useState<Rect | null>(null);

  const isMaximized = restoreRect !== null;

  const toggleMaximize = useCallback(() => {
    const rnd = rndRef.current;
    if (!rnd) return;

    if (restoreRect) {
      // Re-clamped on restore: the desktop may have shrunk while the window was
      // maximized, and the saved geometry wouldn't fit anymore.
      const width = Math.min(restoreRect.width, desktopEl.clientWidth);
      const height = Math.min(restoreRect.height, desktopEl.clientHeight);

      rnd.updateSize({ width, height });
      rnd.updatePosition({
        x: Math.min(Math.max(0, restoreRect.x), desktopEl.clientWidth - width),
        y: Math.min(
          Math.max(0, restoreRect.y),
          desktopEl.clientHeight - height,
        ),
      });
      setRestoreRect(null);
      return;
    }

    const self = rnd.getSelfElement();
    if (!self) return;

    const { x, y } = rnd.getDraggablePosition();
    setRestoreRect({
      x,
      y,
      width: self.offsetWidth,
      height: self.offsetHeight,
    });

    rnd.updatePosition({ x: 0, y: 0 });
    rnd.updateSize({
      width: desktopEl.clientWidth,
      height: desktopEl.clientHeight,
    });
  }, [restoreRect, desktopEl]);

  // The observer must not resubscribe every time the maximized state changes,
  // so it reads it from a ref.
  const isMaximizedRef = useRef(isMaximized);
  isMaximizedRef.current = isMaximized;

  // `bounds="parent"` only kicks in while dragging: without this, shrinking the
  // viewport leaves windows bigger than the desktop or out of sight.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const rnd = rndRef.current;
      const self = rnd?.getSelfElement();
      if (!rnd || !self) return;

      const maxWidth = desktopEl.clientWidth;
      const maxHeight = desktopEl.clientHeight;

      if (isMaximizedRef.current) {
        rnd.updatePosition({ x: 0, y: 0 });
        rnd.updateSize({ width: maxWidth, height: maxHeight });
        return;
      }

      const width = Math.min(self.offsetWidth, maxWidth);
      const height = Math.min(self.offsetHeight, maxHeight);
      const { x, y } = rnd.getDraggablePosition();

      rnd.updateSize({ width, height });
      rnd.updatePosition({
        x: Math.min(Math.max(0, x), maxWidth - width),
        y: Math.min(Math.max(0, y), maxHeight - height),
      });
    });

    observer.observe(desktopEl);

    return () => observer.disconnect();
  }, [desktopEl]);

  // Dragging a maximized window restores it and hooks it to the cursor, keeping
  // the cursor over the same proportional point of the title bar.
  const restoreOnDrag = useCallback(
    (event: RndDragEvent) => {
      const rnd = rndRef.current;
      if (!restoreRect || !rnd) return;

      const self = rnd.getSelfElement();
      if (!self?.offsetWidth) return;

      const selfRect = self.getBoundingClientRect();
      const pointerX =
        "touches" in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
      const grabX = pointerX - selfRect.left;

      const { x, y } = rnd.getDraggablePosition();
      const width = Math.min(restoreRect.width, desktopEl.clientWidth);
      const height = Math.min(restoreRect.height, desktopEl.clientHeight);
      const maxX = desktopEl.clientWidth - width;
      const nextX = x + grabX * (1 - width / self.offsetWidth);

      // `updateSize` is an async setState, but react-rnd computes the drag
      // bounds by reading `offsetWidth` off the DOM the moment this handler
      // returns. Without writing the measurement straight to the node, the
      // bounds would come out with the maximized size and the window wouldn't
      // move at all.
      self.style.width = `${width}px`;
      self.style.height = `${height}px`;
      rnd.updateSize({ width, height });
      rnd.updatePosition({ x: Math.min(Math.max(0, nextX), maxX), y });

      setRestoreRect(null);
    },
    [restoreRect, desktopEl],
  );

  const frame = useMemo(
    () => ({ isMaximized, toggleMaximize, titleId }),
    [isMaximized, toggleMaximize, titleId],
  );

  return (
    <Rnd
      ref={rndRef}
      bounds="parent"
      className={className}
      default={defaultRect}
      minWidth={minWidth}
      minHeight={minHeight}
      style={{
        zIndex: Math.max(0, openWindows.indexOf(id)) + 1,
        ...(hidden ? { display: "none" } : null),
        ...style,
      }}
      dragHandleClassName="window-drag-handle"
      cancel={dragCancel}
      onResizeStart={() => {
        focusWindow(id);
        setInteracting(true);
      }}
      onResizeStop={() => setInteracting(false)}
      onDragStart={(event) => {
        focusWindow(id);
        setInteracting(true);
        restoreOnDrag(event);
      }}
      onDragStop={() => setInteracting(false)}
    >
      <section
        role="dialog"
        aria-labelledby={titleId}
        // Not modal: several windows coexist and the rest of the desktop stays
        // reachable, so announcing it as modal would be a lie.
        aria-modal={false}
        tabIndex={-1}
        data-maximized={isMaximized ? "" : undefined}
        style={WINDOW_BODY_STYLE}
        onFocusCapture={() => focusWindow(id)}
        onMouseDown={() => focusWindow(id)}
        onKeyDown={(event) => {
          if (!closeOnEscape || event.key !== "Escape") return;
          if (event.defaultPrevented) return;

          event.stopPropagation();
          close();
        }}
      >
        <WindowFrameContext value={frame}>{children}</WindowFrameContext>
      </section>
    </Rnd>
  );
}

export type WindowHeaderProps = React.ComponentProps<"header"> & {
  render?: RenderProp<React.ComponentProps<"header">>;
};

export function WindowHeader({
  render,
  className,
  children,
  ...props
}: WindowHeaderProps) {
  const { isMaximized } = useWindowFrame();

  const elementProps = mergeProps(
    {
      // Not styling: it's the selector `Rnd` uses to recognize where the window
      // is dragged from. That's why it stays a class and not a data attribute.
      className: cn("window-drag-handle", className),
      "data-maximized": isMaximized ? "" : undefined,
      children,
    },
    props,
  );

  return renderSlot(render, elementProps, (finalProps) => (
    <header {...(finalProps as React.ComponentProps<"header">)} />
  ));
}

export type WindowContentProps = React.ComponentProps<"div"> & {
  render?: RenderProp<React.ComponentProps<"div">>;
};

export function WindowContent({
  render,
  children,
  ...props
}: WindowContentProps) {
  const elementProps = mergeProps(
    {
      // `flex: 1` with `minHeight: 0` and not `height: 100%`: inside the flex
      // column, 100% measures against the full height and ignores the header,
      // so it used to overflow. Structural, which is why DayOS sets it and not
      // the consumer.
      style: { flex: "1 1 0%", minHeight: 0, overflow: "auto" },
      children,
    },
    props,
  );

  return renderSlot(render, elementProps, (finalProps) => (
    <div {...(finalProps as React.ComponentProps<"div">)} />
  ));
}

export type WindowNameProps = React.ComponentProps<"h2"> & {
  render?: RenderProp<React.ComponentProps<"h2">>;
};

export function WindowName({ render, children, ...props }: WindowNameProps) {
  const { titleId } = useWindowFrame();

  const elementProps = mergeProps({ id: titleId, children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <h2 {...(finalProps as React.ComponentProps<"h2">)} />
  ));
}

export type WindowActionsProps = React.ComponentProps<"div"> & {
  render?: RenderProp<React.ComponentProps<"div">>;
};

export function WindowActions({
  render,
  children,
  ...props
}: WindowActionsProps) {
  const elementProps = mergeProps({ children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <div {...(finalProps as React.ComponentProps<"div">)} />
  ));
}

export type WindowActionProps = React.ComponentProps<"button"> & {
  render?: RenderProp<React.ComponentProps<"button">>;
};

export function WindowAction({
  render,
  children,
  ...props
}: WindowActionProps) {
  const elementProps = mergeProps({ type: "button", children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <button {...(finalProps as React.ComponentProps<"button">)} />
  ));
}

export type WindowExpandProps = Omit<WindowActionProps, "aria-pressed"> & {
  /**
   * The button does two things depending on the state, so its accessible name
   * is two strings and not one: a lone `aria-label` can only describe half.
   */
  maximizeLabel?: string;
  restoreLabel?: string;
};

export function WindowExpand({
  onClick,
  // Plain props rather than a locale context: anyone who wants to set them once
  // can already wrap the component, which is how everything else here is
  // configured.
  maximizeLabel = "Maximize window",
  restoreLabel = "Restore window",
  ...props
}: WindowExpandProps) {
  const { isMaximized, toggleMaximize } = useWindowFrame();

  return (
    <WindowAction
      aria-pressed={isMaximized}
      aria-label={isMaximized ? restoreLabel : maximizeLabel}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleMaximize();
      }}
      {...props}
    />
  );
}

export function WindowClose({ onClick, ...props }: WindowActionProps) {
  // Goes through the app's `close` and not the desktop's `closeWindow` so the
  // close also reaches whoever controls the window from outside.
  const { close } = useDesktopApp();

  return (
    <WindowAction
      // Overridden by an `aria-label` of your own: `props` goes last on purpose.
      aria-label="Close window"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) close();
      }}
      {...props}
    />
  );
}
