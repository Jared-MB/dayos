/**
 * The languages the docs are written in, and the one rule that turns a page's
 * href into an address.
 *
 * Every href in the site is stored without a language on the front — `/docs`,
 * `/docs/api/core` — because a page is the same page whichever language it is
 * read in. `localePath` is the single place that decides what that href looks
 * like in the address bar, which is what keeps the default language unprefixed
 * without every link having to remember the exception.
 */

export const LOCALES = ["en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The language served from the bare paths. Changing this moves `/docs` to the
 * other language and pushes English under a prefix — nothing else has to be
 * touched, but every URL already indexed would move, so it is not a free edit.
 */
export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/**
 * The language a route segment stands for. Routes under `[lang]` are pinned to
 * `LOCALES` by `generateStaticParams` and `dynamicParams = false`, so the
 * fallback here is unreachable in a built site — it exists so the segment can
 * be typed as a `Locale` without an assertion.
 */
export const toLocale = (value: string): Locale =>
  isLocale(value) ? value : DEFAULT_LOCALE;

/**
 * Where an href lives in a given language. The default language keeps the bare
 * path so that nothing already linked to `/docs` moves; every other language
 * sits under its own prefix.
 */
export const localePath = (locale: Locale, href: string) => {
  if (locale === DEFAULT_LOCALE) return href;

  return href === "/" ? `/${locale}` : `/${locale}${href}`;
};

/**
 * The reverse: the language-free href behind an address. Used by the language
 * switcher, which has a pathname and needs the page it names so it can offer
 * that same page somewhere else.
 */
export const stripLocale = (pathname: string): string => {
  const [, first, ...rest] = pathname.split("/");

  if (!first || !isLocale(first)) return pathname;

  return rest.length > 0 ? `/${rest.join("/")}` : "/";
};

/**
 * What each language calls itself. A reader looking for Spanish is looking for
 * "Español", not for "Spanish" — the switcher is the one list on the site that
 * is deliberately not translated.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/** The short label the switcher shows when there is no room for the name. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  es: "ES",
};

/**
 * What Open Graph calls each language. It wants a territory as well as a
 * language, and the pairs below are the ones the docs are written for rather
 * than a claim that no other Spanish exists.
 */
export const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
};

/**
 * The same page in every language, for the `hreflang` links in the head.
 *
 * `x-default` points at the unprefixed path: it is what a reader with no stated
 * preference gets, and it is what everything already links to.
 */
export const languageAlternates = (href: string): Record<string, string> => ({
  ...Object.fromEntries(
    LOCALES.map((locale) => [locale, localePath(locale, href)]),
  ),
  "x-default": localePath(DEFAULT_LOCALE, href),
});
