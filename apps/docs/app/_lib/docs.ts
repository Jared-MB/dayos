/**
 * The docs, assembled: the outline in `nav.ts` says which pages exist and in
 * what order, and each page's own front matter says what it is called. Putting
 * the two together here is what lets a page be edited in one file — a title
 * changes in the sidebar, the search box, the browser tab, the Markdown twin
 * and the heading at once, because all five read the same line of the `.mdx`.
 *
 * The pages are read off disk rather than imported, so nothing here drags a
 * page's compiled prose along with its title. That also keeps this module on
 * the server: the sidebar and the search box are handed the finished lists as
 * props by the layouts that render them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Document, parseDocument } from "./front-matter";
import type { Locale } from "./i18n";
import { type DocPage, type DocSection, HREFS, OUTLINE } from "./nav";

/**
 * Where a page's prose is written: beside the `page.tsx` that renders it, named
 * for the language it is written in. `/docs/routing/matching` in Spanish is
 * `app/[lang]/docs/routing/matching/es.mdx`, and there is nowhere else to look.
 */
export const sourcePath = (locale: Locale, href: string) =>
  join(process.cwd(), "app", "[lang]", href, `${locale}.mdx`);

/**
 * A page's front matter and prose, read once per build.
 *
 * Nothing is cached while developing: the file on disk is the source, and
 * editing a title should show the new one on the next render rather than on
 * the next restart. In a build every page is read a handful of times — the
 * sidebar, the footer, the sitemap, `llms.txt` — and the cache is what keeps
 * that a few dozen reads instead of a few thousand.
 */
const CACHE =
  process.env.NODE_ENV === "development"
    ? undefined
    : new Map<string, Document>();

export function readDocument(locale: Locale, href: string): Document {
  const key = `${locale}:${href}`;
  const cached = CACHE?.get(key);

  if (cached) return cached;

  const where = `app/[lang]${href}/${locale}.mdx`;
  let source: string;

  try {
    source = readFileSync(sourcePath(locale, href), "utf8");
  } catch {
    // Listed in the outline but never written. This runs while the site is
    // being built, so a translation nobody has got to yet is a failed build
    // and not a page that renders empty.
    throw new Error(
      `DayOS docs: ${where} is missing. Every href in app/_lib/nav.ts needs an .mdx for each language beside its route.`,
    );
  }

  const document = parseDocument(source, where);

  CACHE?.set(key, document);

  return document;
}

const page = (locale: Locale, href: string): DocPage => {
  const { body: _body, ...frontMatter } = readDocument(locale, href);

  return { href, ...frontMatter };
};

/** The outline with every page's front matter filled in, in sidebar order. */
export const sections = (locale: Locale): readonly DocSection[] =>
  OUTLINE.map((section) => ({
    title: section.title[locale],
    pages: section.hrefs.map((href) => page(locale, href)),
  }));

/** Every page in reading order, which is the order the footer walks. */
export const pages = (locale: Locale): readonly DocPage[] =>
  HREFS.map((href) => page(locale, href));

export const findPage = (locale: Locale, href: string): DocPage | undefined =>
  HREFS.includes(href) ? page(locale, href) : undefined;

/**
 * The pages either side of this one. Reading the docs front to back is a real
 * way to use them, so every page ends with the way onward.
 */
export const siblings = (locale: Locale, href: string) => {
  const index = HREFS.indexOf(href);

  if (index === -1) return { previous: undefined, next: undefined };

  const at = (position: number) => {
    const found = HREFS[position];

    return found === undefined ? undefined : page(locale, found);
  };

  return { previous: at(index - 1), next: at(index + 1) };
};

/** The section a page belongs to, for the breadcrumb above its title. */
export const sectionOf = (locale: Locale, href: string) => {
  const section = OUTLINE.find((entry) => entry.hrefs.includes(href));

  return section ? { title: section.title[locale] } : undefined;
};
