"use client";

import { useEffect, useRef, useState } from "react";
import { markdownHref, markdownUrl } from "../_lib/nav";

/**
 * The page, for something that is not reading it on the page.
 *
 * Copying it hands over the Markdown twin rather than the text of the DOM: a
 * model given `<span class="t-keyword">const</span>` back from a code block
 * spends its attention on the highlighting. The menu beside it offers the same
 * file as a link, and to the two assistants a reader is most likely to be
 * asking — as a URL, so the answer is about the current documentation and not
 * about whatever the model remembers.
 *
 * The Markdown is fetched rather than sent down with the page: it is a
 * duplicate of everything above it, and nobody who does not press the button
 * should pay for it.
 */
export function CopyPage({ href }: { href: string }) {
  const [isOpen, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "copying" | "copied">("idle");
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Which item the key that opened the menu asked for, read once it exists. */
  const entry = useRef<"first" | "last" | null>(null);

  useEffect(() => () => clearTimeout(timeout.current), []);

  // The arrow keys are the menu's, and they only reach it once something inside
  // it has focus — so opening it moves focus in, in the effect that runs after
  // the items are actually on the page.
  useEffect(() => {
    if (!isOpen || !entry.current) return;

    focusItem(menu.current, entry.current);
    entry.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Anywhere else means "not this menu": another button, the prose, the page
    // behind it. Pointerdown rather than click, so the menu is gone before
    // whatever was clicked responds.
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [isOpen]);

  const open = (focus: "first" | "last") => {
    entry.current = focus;
    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggle.current?.focus();
  };

  const copy = async () => {
    setState("copying");

    try {
      const response = await fetch(markdownHref(href));

      if (!response.ok) throw new Error(`${response.status}`);

      await navigator.clipboard.writeText(await response.text());
    } catch {
      // A refused clipboard or a request that did not land. The Markdown is a
      // link away in the menu, which is a better answer than an error dialog.
      setState("idle");
      return;
    }

    setState("copied");
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setState("idle"), 2000);
  };

  /** Roving focus across the items, as the menu button pattern asks for. */
  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    // Tab leaves the menu, and a menu nobody is in should not still be open.
    if (event.key === "Tab") {
      close(false);
      return;
    }

    const items = itemsOf(menu.current);
    const index = items.indexOf(document.activeElement as HTMLElement);

    const next =
      event.key === "ArrowDown"
        ? (index + 1) % items.length
        : event.key === "ArrowUp"
          ? (index - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : -1;

    if (next === -1) return;

    event.preventDefault();
    items[next]?.focus();
  };

  const url = markdownUrl(href);
  const ask = `Read ${url} so I can ask questions about it.`;

  return (
    <div className="copy-page" ref={root}>
      <button
        className="copy-page-button"
        data-state={state}
        onClick={copy}
        type="button"
      >
        <span aria-hidden="true" className="copy-page-icon">
          {state === "copying" ? (
            <SpinnerIcon />
          ) : state === "copied" ? (
            <CheckIcon />
          ) : (
            <ClipboardIcon />
          )}
        </span>
        {/* The label does not change with the state: a button whose width moves
            under the cursor is a button that gets missed on the second press.
            What happened is said beside it, once, to whoever is listening. */}
        <span>Copy page</span>
      </button>

      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="More ways to read this page"
        className="copy-page-toggle"
        onClick={() => (isOpen ? close(false) : open("first"))}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            close(false);
            return;
          }

          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

          event.preventDefault();
          const where = event.key === "ArrowDown" ? "first" : "last";

          // The same key is the way in and the way back in, for a reader who
          // shift-tabbed out of an open menu.
          if (isOpen) focusItem(menu.current, where);
          else open(where);
        }}
        ref={toggle}
        type="button"
      >
        <ChevronIcon />
      </button>

      {isOpen ? (
        <div
          className="copy-page-menu"
          onKeyDown={onMenuKeyDown}
          ref={menu}
          role="menu"
        >
          <MenuItem
            description="Open this page in Markdown"
            href={markdownHref(href)}
            icon={<MarkdownIcon />}
            label="View as Markdown"
            onSelect={() => close(false)}
          />
          <MenuItem
            description="Ask questions about this page"
            href={`https://claude.ai/new?q=${encodeURIComponent(ask)}`}
            icon={<ExternalIcon />}
            label="Open in Claude"
            onSelect={() => close(false)}
          />
          <MenuItem
            description="Ask questions about this page"
            href={`https://chatgpt.com/?q=${encodeURIComponent(ask)}`}
            icon={<ExternalIcon />}
            label="Open in ChatGPT"
            onSelect={() => close(false)}
          />
        </div>
      ) : null}

      <p aria-live="polite" className="visually-hidden">
        {state === "copied" ? "Page copied as Markdown" : ""}
      </p>
    </div>
  );
}

const itemsOf = (menu: HTMLElement | null) => [
  ...(menu?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []),
];

const focusItem = (menu: HTMLElement | null, where: "first" | "last") => {
  const items = itemsOf(menu);
  items[where === "first" ? 0 : items.length - 1]?.focus();
};

function MenuItem({
  href,
  icon,
  label,
  description,
  onSelect,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    // An anchor and not a button: these are all somewhere to go, and a reader
    // who wants the Markdown in a background tab should be able to have it.
    <a
      className="copy-page-item"
      href={href}
      onClick={onSelect}
      rel="noreferrer"
      role="menuitem"
      target="_blank"
    >
      <span aria-hidden="true" className="copy-page-item-icon">
        {icon}
      </span>
      <span className="copy-page-item-label">{label}</span>
      <span className="copy-page-item-description">{description}</span>
    </a>
  );
}

function ClipboardIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="14"
    >
      <rect height="13" rx="2" width="13" x="9" y="9" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Spun by the stylesheet, which is also where the motion preference is honoured. */
function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="copy-page-spinner"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <circle cx="12" cy="12" opacity="0.3" r="9" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** The Markdown mark, at the size of a menu icon. */
function MarkdownIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="12"
      viewBox="0 0 208 128"
      width="16"
    >
      <rect
        height="118"
        rx="10"
        stroke="currentColor"
        strokeWidth="10"
        width="198"
        x="5"
        y="5"
      />
      <path
        d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z"
        fill="currentColor"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
