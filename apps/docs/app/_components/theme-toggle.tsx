"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * The script that runs before the first paint. It has to be inline and blocking
 * — anything later and the page paints in the wrong theme first, which is the
 * white flash every dark-mode site has to earn its way out of.
 *
 * It only writes `data-theme` when there is a stored choice. With none, the
 * attribute stays absent and the CSS falls through to `prefers-color-scheme`,
 * so the system preference is the default rather than something copied into
 * storage on first visit.
 */
export const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem("dayos-theme");
  if (stored === "light" || stored === "dark") {
    document.documentElement.dataset.theme = stored;
  }
} catch (error) {}
`;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>();

  // Read after mount, never during render: the server has no way to know what
  // is in this browser's storage, and guessing is a hydration mismatch.
  useEffect(() => {
    const stored = document.documentElement.dataset.theme;

    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    setTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";

    setTheme(next);
    document.documentElement.dataset.theme = next;

    try {
      localStorage.setItem("dayos-theme", next);
    } catch {
      // Storage can be unavailable (private mode, a blocked third-party
      // context). The theme still changes for this page; it just will not be
      // remembered, which beats failing the click.
    }
  };

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="icon-button"
      onClick={toggle}
      type="button"
    >
      {/* Both icons ship, and CSS picks. Until the effect has run there is no
          theme to render, and swapping icons on hydration would flicker. */}
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
