"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/**
 * The theme, for the whole tree.
 *
 * `next-themes` still injects a blocking inline script before the first paint —
 * there is no way to know a stored preference without one, and anything later
 * paints the page in the wrong theme first. The difference is that it owns that
 * script, the storage key, the `prefers-color-scheme` listener and the
 * cross-tab sync, rather than us maintaining a hand-rolled version of each.
 *
 * `data-theme` is the attribute the stylesheet already keys on. System
 * preference is followed by default, and the attribute always ends up holding a resolved `light` or
 * `dark`, so the media-query blocks in `globals.css` only matter when the
 * script never runs at all — which is exactly the no-JavaScript fallback they
 * were written to be.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      // Kept from the hand-rolled version so a reader who already chose a theme
      // keeps it across this change.
      storageKey="dayos-theme"
      // Colours are custom properties, so a theme swap would otherwise animate
      // every `transition` on the page at once.
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
