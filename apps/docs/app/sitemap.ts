import type { MetadataRoute } from "next";
import { PAGES } from "./_lib/nav";
import { SITE_URL } from "./_lib/site";

/**
 * Built from the same list the sidebar reads, so a page that exists is a page
 * that gets listed — there is no second inventory to remember to update.
 *
 * No `lastModified`: nothing here tracks when a page actually changed, and
 * stamping every URL with the build time would tell crawlers the whole site
 * was rewritten on every deploy.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    ...PAGES.map((page) => ({
      url: new URL(page.href, SITE_URL).toString(),
      priority: page.href === "/docs" ? 0.8 : 0.5,
    })),
  ];
}
