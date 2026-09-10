import type { MetadataRoute } from "next";
import { LOCALES, localePath } from "./_lib/i18n";
import { HREFS } from "./_lib/nav";
import { SITE_URL } from "./_lib/site";

/**
 * Built from the same list the sidebar reads, so a page that exists is a page
 * that gets listed — there is no second inventory to remember to update.
 *
 * Every page appears once per language, and each entry names the others through
 * `alternates.languages`. Without that a crawler sees two pages that say the
 * same thing in different words and has to guess they are the same page.
 *
 * No `lastModified`: nothing here tracks when a page actually changed, and
 * stamping every URL with the build time would tell crawlers the whole site
 * was rewritten on every deploy.
 */

const url = (path: string) => new URL(path, SITE_URL).toString();

const alternates = (href: string) => ({
  languages: Object.fromEntries(
    LOCALES.map((locale) => [locale, url(localePath(locale, href))]),
  ),
});

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) => [
    {
      url: url(localePath(locale, "/")),
      priority: 1,
      alternates: alternates("/"),
    },
    ...HREFS.map((href) => ({
      url: url(localePath(locale, href)),
      priority: href === "/docs" ? 0.8 : 0.5,
      alternates: alternates(href),
    })),
  ]);
}
