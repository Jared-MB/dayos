"use client";

import { createContext, useContext, useMemo } from "react";
import { type Dictionary, dictionary } from "../_lib/dictionary";
import { DEFAULT_LOCALE, type Locale } from "../_lib/i18n";

/**
 * The language, for the parts of the page that run in the browser.
 *
 * A server component reads its language off the route's `lang` segment, but a
 * client component has no params — and threading one down through the sidebar,
 * the search box, the theme toggle and every copy button would put a `lang`
 * prop on components that have nothing else to do with language. The provider
 * sits once at the root of the tree instead.
 *
 * The default is only ever a formality: the provider wraps everything under
 * `[lang]`, and there is nothing outside it.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);

/** The words, for a component that only wants to say something. */
export function useDictionary(): Dictionary {
  const locale = useLocale();

  return useMemo(() => dictionary(locale), [locale]);
}
