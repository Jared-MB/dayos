"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type DocSection, pageHref } from "../_lib/nav";
import { useDictionary, useLocale } from "./locale-provider";

/**
 * The docs navigation. It is a client component for one reason: the current
 * page has to be marked, and only the browser knows which one that is.
 *
 * The list arrives as a prop rather than being looked up here. Every title in
 * it is read from the top of a page's `.mdx`, which only the server can do —
 * and handing over the finished list means what crosses to the browser is a
 * few dozen strings rather than the pages they came from.
 *
 * On a narrow screen it becomes a drawer. The markup does not change between
 * the two — the same list, moved by CSS — so a link is never rendered twice and
 * the focus order stays what it looks like.
 */
export function Sidebar({ sections }: { sections: readonly DocSection[] }) {
  const locale = useLocale();
  const d = useDictionary();
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
        {d.sidebar.menu}
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
        aria-label={d.sidebar.label}
        className="sidebar"
        data-open={isOpen ? "" : undefined}
        id="docs-sidebar"
      >
        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>
              <ul className="sidebar-list">
                {section.pages.map((page) => {
                  // The stored href has no language on it; the address in the
                  // bar does. Comparing the two directly would leave every
                  // link unmarked in every language but the default.
                  const href = pageHref(locale, page.href);
                  const isActive = pathname === href;

                  return (
                    <li key={page.href}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className="sidebar-link"
                        data-active={isActive ? "" : undefined}
                        href={href}
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
