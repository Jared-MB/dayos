"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type WindowPresence = {
  /** `false` from the moment the window closes, while its exit plays. */
  isPresent: boolean;
  /** Call it when the exit animation ends so the window can go away. */
  safeToRemove: () => void;
};

type WindowPresenceContextType = WindowPresence & {
  register: () => () => void;
};

const WindowPresenceContext = createContext<WindowPresenceContextType | null>(
  null,
);

/**
 * Lets the element passed to `Window`'s `render` play an exit animation:
 * calling it tells the window to stay on screen after closing until
 * `safeToRemove` runs. Same shape as motion's `usePresence`, so wiring it to
 * `onAnimationComplete` is one line. Windows that never call it close
 * instantly, as always.
 */
export function useWindowPresence(): WindowPresence {
  const context = useContext(WindowPresenceContext);

  if (!context)
    throw new Error("useWindowPresence must be used within a Window");

  const { register, isPresent, safeToRemove } = context;

  // `register` is stable, so this registers once per mount.
  useEffect(() => register(), [register]);

  return { isPresent, safeToRemove };
}

/**
 * The window's side of `useWindowPresence`. `isRendered` is what decides
 * whether the window is on screen: it's `isWindowOpen` itself unless something
 * inside registered an exit, in which case it holds on until `safeToRemove`.
 * Derived rather than synced in an effect so a window without an exit closes
 * on the exact same render it always did.
 */
export function useWindowPresenceState(isWindowOpen: boolean) {
  const [presenceCount, setPresenceCount] = useState(0);
  const [hasExited, setHasExited] = useState(!isWindowOpen);

  useEffect(() => {
    if (isWindowOpen) setHasExited(false);
  }, [isWindowOpen]);

  // Read from a ref so a `safeToRemove` from an exit that got interrupted by a
  // reopen does nothing: otherwise the next close would skip its animation.
  const isWindowOpenRef = useRef(isWindowOpen);
  isWindowOpenRef.current = isWindowOpen;

  const safeToRemove = useCallback(() => {
    if (!isWindowOpenRef.current) setHasExited(true);
  }, []);

  const register = useCallback(() => {
    setPresenceCount((count) => count + 1);
    return () => setPresenceCount((count) => count - 1);
  }, []);

  const isRendered = isWindowOpen || (presenceCount > 0 && !hasExited);

  const presence = useMemo(
    () => ({ isPresent: isWindowOpen, safeToRemove, register }),
    [isWindowOpen, safeToRemove, register],
  );

  return { isRendered, presence };
}

export function WindowPresenceProvider({
  value,
  children,
}: {
  value: WindowPresenceContextType;
  children: React.ReactNode;
}) {
  return (
    <WindowPresenceContext value={value}>{children}</WindowPresenceContext>
  );
}
