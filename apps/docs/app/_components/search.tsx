"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { type DocPage, type DocSection, pageHref } from "../_lib/nav";
import { useDictionary, useLocale } from "./locale-provider";

/**
 * Search across the docs, over the same list the sidebar renders — titles,
 * descriptions and keywords, all of them written at the top of the page they
 * belong to. There are a couple of dozen pages, so the whole index is a handful
 * of strings and the matching can happen on every keystroke without anyone
 * noticing.
 *
 * No index to build and no service to call: the tradeoff is that it searches
 * titles, descriptions and keywords rather than the body of each page. For a
 * site this size that is the difference between finding "keepMounted" and
 * finding the paragraph it appears in, and the first is what the reader wants
 * from a jump-to-page box.
 */
type Entry = { page: DocPage; section: string };
type Result = Entry & { score: number };

/** Every page, each remembering the heading it was listed under. */
const index = (sections: readonly DocSection[]): readonly Entry[] =>
  sections.flatMap((section) =>
    section.pages.map((page) => ({ page, section: section.title })),
  );

/**
 * How well a page answers a query. A hit in the title beats one in the
 * description, and a title that starts with the query beats one that merely
 * contains it, so typing "win" puts "Windows" above the pages that mention it.
 */
const score = (page: DocPage, query: string) => {
  const title = page.title.toLowerCase();
  const description = page.description?.toLowerCase() ?? "";
  const keywords = page.keywords?.join(" ").toLowerCase() ?? "";

  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (keywords.includes(query)) return 40;
  if (description.includes(query)) return 20;

  return 0;
};

export function Search({ sections }: { sections: readonly DocSection[] }) {
  const locale = useLocale();
  const d = useDictionary();
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = useMemo<Result[]>(() => {
    const trimmed = query.trim().toLowerCase();
    const entries = index(sections);

    // With an empty box, offer the pages rather than nothing: opening the
    // palette and seeing the docs' shape is a reasonable way to use it.
    if (!trimmed) {
      return entries.slice(0, 8).map((entry) => ({ ...entry, score: 0 }));
    }

    return entries
      .map((entry) => ({ ...entry, score: score(entry.page, trimmed) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query, sections]);

  // The selection has to come back into range when the results change: typing
  // one more character can leave it pointing past the end of a shorter list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `query` is the trigger, not an input — the effect resets rather than reads
  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isShortcut) {
        event.preventDefault();
        setOpen((open) => !open);
        return;
      }

      if (event.key === "/" && !isEditing(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }

    inputRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keeps the highlighted row on screen when the arrows walk past the fold. It
  // finds the row through the DOM rather than by index, so the dependency on
  // `selected` is real even though the value never appears in the body.
  // biome-ignore lint/correctness/useExhaustiveDependencies: read through the DOM, via the data attribute `selected` writes
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected=""]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => (current + 1) % Math.max(1, results.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected(
        (current) =>
          (current - 1 + Math.max(1, results.length)) %
          Math.max(1, results.length),
      );
      return;
    }

    if (event.key === "Enter") {
      const result = results[selected];
      if (result) {
        event.preventDefault();
        go(pageHref(locale, result.page.href));
      }
    }
  };

  return (
    <>
      <button
        className="search-trigger"
        onClick={() => setOpen(true)}
        type="button"
      >
        <SearchIcon />
        <span className="search-trigger-text">{d.search.trigger}</span>
        <kbd className="search-kbd">⌘K</kbd>
      </button>

      {isOpen ? (
        <div className="search-overlay">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop; Escape and the close path are on the dialog */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled on the input */}
          <div className="search-backdrop" onClick={() => setOpen(false)} />

          <div
            aria-label={d.search.dialogLabel}
            aria-modal="true"
            className="search-dialog"
            role="dialog"
          >
            <div className="search-field">
              <SearchIcon />
              <input
                aria-activedescendant={
                  results[selected] ? `search-${selected}` : undefined
                }
                aria-autocomplete="list"
                aria-controls="search-results"
                className="search-input"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={d.search.placeholder}
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                type="text"
                value={query}
              />
              <kbd className="search-kbd">{d.search.escape}</kbd>
            </div>

            {results.length === 0 ? (
              <p className="search-empty">{d.search.empty(query.trim())}</p>
            ) : (
              /*
                A div and not a ul: the options are the buttons themselves, and
                wrapping each in an <li role="none"> only adds markup that has
                to be neutralised again.
              */
              <div
                className="search-results"
                id="search-results"
                ref={listRef}
                role="listbox"
              >
                {results.map((result, index) => (
                  <button
                    aria-selected={index === selected}
                    className="search-result"
                    data-selected={index === selected ? "" : undefined}
                    id={`search-${index}`}
                    key={result.page.href}
                    onClick={() => go(pageHref(locale, result.page.href))}
                    onMouseEnter={() => setSelected(index)}
                    role="option"
                    type="button"
                  >
                    <span className="search-result-section">
                      {result.section}
                    </span>
                    <span className="search-result-title">
                      {result.page.title}
                    </span>
                    <span className="search-result-description">
                      {result.page.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Whether the key went to somewhere the reader is typing, where `/` is a slash. */
const isEditing = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="15"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="15"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
