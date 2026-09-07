"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LOCALE_LABELS,
  LOCALE_NAMES,
  LOCALES,
  localePath,
  stripLocale,
} from "../_lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";

/**
 * The languages, as links rather than as a menu.
 *
 * A reader switching language wants the page they are on in the other
 * language, not the index — so the current path is stripped of its prefix and
 * handed back with a different one. Because the two lists in `nav.ts` hold the
 * same hrefs in the same order, that page always exists.
 *
 * Links and not a `<select>` or a popup: with a handful of languages there is
 * nothing to hide behind a disclosure, and a link can be opened in a new tab,
 * middle-clicked, and read by a crawler as the alternate it is. A site that
 * grows past four or five languages should revisit that.
 */
export function LanguageSwitcher() {
  const pathname = usePathname();
  const current = useLocale();
  const d = useDictionary();

  const href = stripLocale(pathname);

  return (
    // A <nav> and not a group: these are links to the same page elsewhere,
    // which is navigation. The label is what separates it from the main nav in
    // the list a screen reader offers.
    <nav aria-label={d.language.label} className="language-switcher">
      {LOCALES.map((locale) => {
        const isCurrent = locale === current;

        return (
          <Link
            aria-current={isCurrent ? "true" : undefined}
            className="language-option"
            data-active={isCurrent ? "" : undefined}
            href={localePath(locale, href)}
            hrefLang={locale}
            key={locale}
            // The name is in the language it names, so the element is too:
            // without this a screen reader says "Español" with English vowels.
            lang={locale}
          >
            <span aria-hidden="true">{LOCALE_LABELS[locale]}</span>
            {/* The two-letter code is a shorthand; the name is what it stands
                for, and it is what anyone not reading the pixels should get. */}
            <span className="visually-hidden">{LOCALE_NAMES[locale]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
