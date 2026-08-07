import Link from "next/link";
import { EXAMPLE_APP, REPOSITORY } from "../_lib/site";
import { Search } from "./search";
import { ThemeToggle } from "./theme-toggle";

const VERSION = "0.2.2";

export function TopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="top-nav-left">
          <Link aria-label="DayOS home" className="wordmark" href="/">
            <WindowsMark />
            <span className="wordmark-text">DayOS</span>
          </Link>
          <span className="version-badge">v{VERSION}</span>
        </div>

        <nav aria-label="Main" className="top-nav-links">
          <Link className="top-nav-link" href="/docs">
            Docs
          </Link>
          <Link className="top-nav-link" href="/docs/api/core">
            API
          </Link>
          {/*
            The demo is not deployed anywhere, so this goes to its source
            instead of to a URL that only exists while someone runs `pnpm dev`.
          */}
          <a
            className="top-nav-link"
            href={EXAMPLE_APP}
            rel="noreferrer"
            target="_blank"
          >
            Example
          </a>
        </nav>

        <div className="top-nav-right">
          <Search />
          <a
            aria-label="DayOS on GitHub"
            className="icon-button"
            href={REPOSITORY}
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** Two overlapping windows: the thing the library is, at 20 pixels. */
function WindowsMark() {
  return (
    <svg
      aria-hidden="true"
      className="wordmark-mark"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <rect
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        width="14"
        x="2.5"
        y="3.5"
      />
      <path d="M2.5 7.5h14" stroke="currentColor" strokeWidth="1.6" />
      <rect
        fill="var(--bg)"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        width="14"
        x="7.5"
        y="8.5"
      />
      <path d="M7.5 12.5h14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="16"
      viewBox="0 0 16 16"
      width="16"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
