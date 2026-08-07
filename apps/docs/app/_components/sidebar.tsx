"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SECTIONS } from "../_lib/nav";

/**
 * The docs navigation. It is a client component for one reason: the current
 * page has to be marked, and only the browser knows which one that is.
 *
 * On a narrow screen it becomes a drawer. The markup does not change between
 * the two — the same list, moved by CSS — so a link is never rendered twice and
 * the focus order stays what it looks like.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  // Any navigation closes the drawer. Without this, tapping a link on a phone
  // leaves the menu covering the page that was just opened.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `pathname` is the trigger — a navigation is the event being reacted to
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes it too, and the body stops scrolling underneath while it is
  // open.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        aria-controls="docs-sidebar"
        aria-expanded={isOpen}
        className="sidebar-toggle"
        onClick={() => setOpen((open) => !open)}
        type="button"
      >
        <MenuIcon />
        Menu
      </button>

      {/*
        Purely decorative: it dims the page and gives a pointer somewhere to
        click. Escape closes the drawer for the keyboard, which is why this can
        be aria-hidden without stranding anyone.
      */}
      <div
        aria-hidden="true"
        className="sidebar-backdrop"
        data-open={isOpen ? "" : undefined}
        onClick={() => setOpen(false)}
      />

      <aside
        aria-label="Documentation"
        className="sidebar"
        data-open={isOpen ? "" : undefined}
        id="docs-sidebar"
      >
        <nav className="sidebar-nav">
          {SECTIONS.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>
              <ul className="sidebar-list">
                {section.pages.map((page) => {
                  const isActive = pathname === page.href;

                  return (
                    <li key={page.href}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className="sidebar-link"
                        data-active={isActive ? "" : undefined}
                        href={page.href}
                      >
                        {page.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
