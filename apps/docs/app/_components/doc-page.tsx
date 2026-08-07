import type { Metadata } from "next";
import Link from "next/link";
import { findPage, markdownHref, sectionOf, siblings } from "../_lib/nav";
import { CopyPage } from "./copy-page";

/**
 * The frame around a page's prose: breadcrumb, title, description and the
 * previous/next footer. All four come from the registry, so a page writes its
 * content and nothing else — and its title can't end up saying one thing in the
 * sidebar and another above the text.
 */
export function DocPage({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const page = findPage(href);
  const section = sectionOf(href);
  const { previous, next } = siblings(href);

  if (!page) {
    throw new Error(
      `DayOS docs: no page registered for ${JSON.stringify(href)}. Add it to SECTIONS in app/_lib/nav.ts.`,
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
          <p className="doc-description">{page.description}</p>
        </header>

        {children}
      </article>

      <nav aria-label="Pagination" className="doc-pagination">
        {previous ? (
          <Link
            className="pagination-link"
            data-direction="previous"
            href={previous.href}
          >
            <span className="pagination-label">← Previous</span>
            <span className="pagination-title">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            className="pagination-link"
            data-direction="next"
            href={next.href}
          >
            <span className="pagination-label">Next →</span>
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
 * The page's `metadata`, from the same entry that titles it. Exported by every
 * route so the tab, the search result and the heading say the same thing.
 */
export function docMetadata(href: string): Metadata {
  const page = findPage(href);

  if (!page) return {};

  return {
    title: `${page.title} — DayOS`,
    description: page.description,
    // The Markdown twin, announced in the head so something crawling the page
    // can take the plain version without being told about it. `canonical` is
    // repeated because a page's `alternates` replaces the root's rather than
    // merging with it, and dropping it here would drop it from every doc page.
    alternates: {
      canonical: href,
      types: { "text/markdown": markdownHref(href) },
    },
  };
}
