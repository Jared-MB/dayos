/**
 * The docs' outline: which pages there are, in what order, under which
 * heading. That is all it is — a page's title, its description and the words
 * it can be searched for are written at the top of the page itself, and
 * `docs.ts` is what puts the two halves together.
 *
 * One list of hrefs serves every language, so a page cannot exist in English
 * and quietly go missing in Spanish; only the section headings, which are the
 * navigation's own words rather than any page's, are written twice. An href is
 * language-free (`/docs/windows`, never `/es/docs/windows`) and only becomes an
 * address through `localePath`, which is what lets the language switcher offer
 * the reader the page they are on rather than dropping them at the index.
 *
 * Everything here is plain data with no file reads behind it, because the
 * sidebar and the search box run in the browser and take it with them.
 */

import type { FrontMatter } from "./front-matter";
import { type Locale, localePath } from "./i18n";
import { SITE_URL } from "./site";

/** A page's own front matter, plus where it lives. */
export type DocPage = FrontMatter & {
  /** Language-free, and the same string in every language. */
  href: string;
};

export type DocSection = {
  title: string;
  pages: readonly DocPage[];
};

export type OutlineSection = {
  /** The heading over the group in the sidebar, in each language. */
  title: Record<Locale, string>;
  hrefs: readonly string[];
};

export const OUTLINE: readonly OutlineSection[] = [
  {
    title: { en: "Getting Started", es: "Primeros pasos" },
    hrefs: ["/docs", "/docs/installation", "/docs/quick-start"],
  },
  {
    title: { en: "Building Your Desktop", es: "Construye tu escritorio" },
    hrefs: [
      "/docs/desktop-and-apps",
      "/docs/windows",
      "/docs/styling",
      "/docs/render",
      "/docs/state",
      "/docs/server-rendering",
    ],
  },
  {
    title: { en: "Routing", es: "Rutas" },
    hrefs: [
      "/docs/routing",
      "/docs/routing/dynamic-routes",
      "/docs/routing/matching",
    ],
  },
  {
    title: { en: "API Reference", es: "Referencia de la API" },
    hrefs: ["/docs/api/core", "/docs/api/next"],
  },
  {
    title: {
      en: "More",
      es: "Más",
    },
    hrefs: ["/docs/examples", "/docs/troubleshooting"],
  },
];

/** Every href in reading order, which is also the order the footer walks. */
export const HREFS: readonly string[] = OUTLINE.flatMap(
  (section) => section.hrefs,
);

/** Where a page lives in a given language, ready to put in an `href`. */
export const pageHref = (locale: Locale, href: string) =>
  localePath(locale, href);

/**
 * Where a page's Markdown twin lives: the same path with `.md` on the end, so
 * `/docs` becomes `/docs.md` and every other page gains a sibling of its own.
 * It lives here rather than beside the routes that serve it because the button
 * offering it runs in the browser, and must not drag the pages in with it.
 */
export const markdownHref = (locale: Locale, href: string) =>
  `${localePath(locale, href)}.md`;

export const markdownUrl = (locale: Locale, href: string) =>
  new URL(markdownHref(locale, href), SITE_URL).toString();
