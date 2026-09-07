import Link from "next/link";
import { CopyButton } from "./_components/copy-button";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Windows, for React.</h1>
        <p className="hero-tagline">
          A desktop with draggable windows: icons, windows you can move, resize
          and maximize, and a focus stack. No styling of its own and no
          knowledge of routes.
        </p>

        <div className="hero-actions">
          <Link className="button" href="/docs">
            Get started
          </Link>
          <Link
            className="button"
            data-variant="secondary"
            href="/docs/api/core"
          >
            API reference
          </Link>
        </div>

        <div className="hero-install">
          <span>pnpm add @dayos/core</span>
          <CopyButton text="pnpm add @dayos/core" />
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature">
          <h2>Headless</h2>
          <p>
            The only CSS DayOS sets is structural. The desktop is positioned and
            clipped, the window is a flex column, and everything you can see is
            yours.
          </p>
        </div>
        <div className="feature">
          <h2>Composable</h2>
          <p>
            Every component takes a <code>render</code> prop that swaps out the
            element it emits while keeping the behavior. An icon can be a link.
          </p>
        </div>
        <div className="feature">
          <h2>Server rendered</h2>
          <p>
            A window that is open during the server render lands in the HTML
            with its content inside, sized and placed to match where it will sit
            once mounted.
          </p>
        </div>
        <div className="feature">
          <h2>Windows with URLs</h2>
          <p>
            The optional Next adapter gives every window a route of its own, so
            the front window is the URL and the link is shareable.
          </p>
        </div>
      </section>
    </>
  );
}
