import type { Metadata } from "next";
import { LocaleProvider } from "../_components/locale-provider";
import { ThemeProvider } from "../_components/theme-provider";
import { TopNav } from "../_components/top-nav";
import { dictionary } from "../_lib/dictionary";
import {
  LOCALES,
  languageAlternates,
  localePath,
  OG_LOCALES,
  toLocale,
} from "../_lib/i18n";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "../_lib/site";
import "../globals.css";

/**
 * The site's root layout, one level down from where a root layout usually
 * sits: everything readable is under a language, so the `<html>` element is
 * too — it is the element that has to carry `lang`, and there is nothing
 * sensible to put there before the language is known.
 *
 * The default language keeps the unprefixed paths, which `next.config.js`
 * rewrites onto this segment. `/en/docs` therefore also resolves, and every
 * page names its unprefixed twin as canonical so that the pair is one page
 * rather than two.
 */

type Params = { params: Promise<{ lang: string }> };

/** Both languages, and only both: `dynamicParams` closes the segment. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = toLocale((await params).lang);

  return {
    // Without this the relative URLs below stay relative, and a link shared
    // anywhere off the site loses its card.
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_TITLE[lang],
      template: "%s",
    },
    description: SITE_DESCRIPTION[lang],
    alternates: {
      canonical: localePath(lang, "/"),
      // Every language's copy of this page, so a search engine can offer the
      // reader the one they asked for instead of picking.
      languages: languageAlternates("/"),
    },
    // No title or description here on purpose: naming them would freeze the
    // root's pair onto every page's card. Left out, each page's own title and
    // description fill them in.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: localePath(lang, "/"),
      locale: OG_LOCALES[lang],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode }> & Params) {
  const lang = toLocale((await params).lang);
  const d = dictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LocaleProvider locale={lang}>
            <a className="skip-link" href="#doc-article">
              {d.skipToContent}
            </a>
            <TopNav lang={lang} />
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
