import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { dictionary } from "../_lib/dictionary";
import { findPage, sectionOf, siblings } from "../_lib/docs";
import { type Locale, languageAlternates, localePath } from "../_lib/i18n";
import { markdownHref, pageHref } from "../_lib/nav";
import { CopyPage } from "./copy-page";

/**
 * The frame around a page's prose: breadcrumb, title, description and the
 * previous/next footer.
 *
 * The title and description are the page's own front matter, read back out of
 * the same `.mdx` the prose comes from — so the file a writer opens holds
 * everything that ends up on the screen, and the heading above the text cannot
 * end up saying something different from the link in the sidebar. Only the
 * breadcrumb and the footer come from elsewhere, because neither is about this
 * page: they are where it sits among the others.
 *
 * The prose is passed in rather than looked up. A route imports the two `.mdx`
 * files sitting beside it and hands over the one the reader asked for, which
 * makes the page's folder the whole answer to "where is this written?".
 */
export function DocPage({
  href,
  lang,
  children,
}: {
  href: string;
  lang: Locale;
  children: ReactNode;
}) {
  const page = findPage(lang, href);
  const section = sectionOf(lang, href);
  const { previous, next } = siblings(lang, href);
  const d = dictionary(lang);

  if (!page) {
    throw new Error(
      `DayOS docs: no page registered for ${JSON.stringify(href)}. Add it to the outline in app/_lib/nav.ts.`,
    );
  }

  return (
    <div className="doc-page">
      <article className="doc-article" id="doc-article">
        <header className="doc-header">
          <div className="doc-header-top">
            {section ? <p className="doc-breadcrumb">{section.title}</p> : null}
            <CopyPage href={href} />
          </div>
          <h1>{page.title}</h1>
          {page.description ? (
            <p className="doc-description">{page.description}</p>
          ) : null}
        </header>

        {children}
      </article>

      <nav aria-label={d.pagination.label} className="doc-pagination">
        {previous ? (
          <Link
            className="pagination-link"
            data-direction="previous"
            href={pageHref(lang, previous.href)}
          >
            <span className="pagination-label">{d.pagination.previous}</span>
            <span className="pagination-title">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            className="pagination-link"
            data-direction="next"
            href={pageHref(lang, next.href)}
          >
            <span className="pagination-label">{d.pagination.next}</span>
            <span className="pagination-title">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

/**
 * The page's `metadata`, from the same front matter that titles it. Exported by
 * every route so the tab, the search result and the heading say the same thing.
 */
export function docMetadata(lang: Locale, href: string): Metadata {
  const page = findPage(lang, href);

  if (!page) return {};

  return {
    title: `${page.title} — DayOS`,
    description: page.description,
    // The Markdown twin, announced in the head so something crawling the page
    // can take the plain version without being told about it. `canonical` is
    // repeated because a page's `alternates` replaces the root's rather than
    // merging with it, and dropping it here would drop it from every doc page.
    alternates: {
      canonical: localePath(lang, href),
      languages: languageAlternates(href),
      types: { "text/markdown": markdownHref(lang, href) },
    },
  };
}
