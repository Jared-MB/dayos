"use client";

import { type ClassValue, clsx } from "clsx";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";

/**
 * Vendored on purpose rather than imported from the consuming app: DayOS ships
 * as its own package and can't reach for whoever's `~/lib/utils`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Props = Record<string, unknown>;

/** Composition prop: replaces the element the component renders. */
export type RenderProp<P> = React.ReactElement<P>;

const isEventHandlerKey = (key: string) =>
  key.length > 2 && key.startsWith("on") && key[2] === key[2]?.toUpperCase();

/**
 * Joins the component's own props with the ones the consumer passes in.
 * Handlers are composed (ours run first), `className` goes through `cn` and
 * `style` is merged; for everything else the consumer wins.
 */
export function mergeProps(base: Props, overrides: Props | undefined): Props {
  if (!overrides) return base;

  const merged: Props = { ...base };

  for (const key of Object.keys(overrides)) {
    const ours = base[key];
    const theirs = overrides[key];

    if (theirs === undefined) continue;

    if (key === "className") {
      merged[key] = cn(ours as ClassValue, theirs as ClassValue);
      continue;
    }

    if (key === "style") {
      merged[key] = { ...(ours as object), ...(theirs as object) };
      continue;
    }

    if (isEventHandlerKey(key) && typeof ours === "function") {
      merged[key] = (...args: unknown[]) => {
        (ours as (...a: unknown[]) => void)(...args);
        (theirs as (...a: unknown[]) => void)(...args);
      };
      continue;
    }

    merged[key] = theirs;
  }

  return merged;
}

/**
 * Renders `render` in place of the default element, keeping the behavior DayOS
 * contributes. With no `render`, falls back to the component's own element.
 */
export function renderSlot(
  render: React.ReactElement | undefined,
  props: Props,
  fallback: (finalProps: Props) => React.ReactElement,
): React.ReactElement {
  if (isValidElement(render)) {
    return cloneElement(render, mergeProps(props, render.props as Props));
  }

  return fallback(props);
}

/**
 * State that works controlled or uncontrolled depending on whether it gets a
 * `value`. Lets the desktop be driven from outside (persistence, a dock,
 * keyboard shortcuts) without duplicating the logic.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);

  const isControlled = value !== undefined;
  const state = isControlled ? value : uncontrolled;

  // Written during render so `setState` can read the value from this very
  // cycle: two calls in a row inside one handler have to chain.
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(stateRef.current)
          : next;

      if (Object.is(resolved, stateRef.current)) return;

      stateRef.current = resolved;
      if (!isControlled) setUncontrolled(resolved);
      onChange?.(resolved);
    },
    [isControlled, onChange],
  );

  return [state, setState] as const;
}
