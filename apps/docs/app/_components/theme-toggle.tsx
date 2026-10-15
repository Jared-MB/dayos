"use client";

import { useTheme } from "next-themes";
import { useDictionary } from "./locale-provider";

export function ThemeToggle() {
  const d = useDictionary();
  const { resolvedTheme, setTheme } = useTheme();

  // Undefined until `next-themes` has read the browser's preference after
  // mount: the server has no way to know what is in this browser's storage,
  // and guessing is a hydration mismatch. The label the server renders is the
  // light-theme one, matching the stylesheet's own default.
  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <button
      suppressHydrationWarning
      aria-label={resolvedTheme === "dark" ? d.theme.toLight : d.theme.toDark}
      className="icon-button"
      onClick={toggle}
      type="button"
    >
      {/* Both icons ship, and CSS picks. Swapping them in JavaScript would
          render the wrong one until hydration. */}
      <SunIcon />
      <MoonIcon />
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="icon-sun"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="icon-moon"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
