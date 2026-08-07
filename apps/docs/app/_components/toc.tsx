"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: number };

/**
 * "On this page", read off the rendered article rather than declared per page.
 *
 * The alternative is every page listing its own headings, which is the same
 * information written twice and one edit away from disagreeing with itself.
 * Scanning the DOM means the list cannot be wrong.
 */
export function TableOfContents() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>();

  // Runs on mount and again on every navigation: the article is replaced
  // wholesale, so the headings found before belong to a page that is gone.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `pathname` is the trigger — it stands for "the article changed"
  useEffect(() => {
    const article = document.getElementById("doc-article");
    if (!article) return;

    const found = [...article.querySelectorAll<HTMLElement>("h2[id], h3[id]")]
      .map((element) => ({
        id: element.id,
        // The heading's own text, without the `#` anchor that sits inside it.
        text: element.textContent?.replace(/^#/, "").trim() ?? "",
        level: Number(element.tagName[1]),
      }))
      .filter((heading) => heading.text.length > 0);

    setHeadings(found);
    setActiveId(found[0]?.id);
  }, [pathname]);

  // Which heading the reader is at. The top band of the viewport is what counts
  // as "here": a heading is current from the moment it reaches the top until
  // the next one does, which is what the eye is doing anyway.
  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
          return;
        }

        // Nothing in the band: the reader is between two headings, so the
        // current one is the last that went past the top.
        const above = elements
          .filter((element) => element.getBoundingClientRect().top < 120)
          .at(-1);

        if (above) setActiveId(above.id);
      },
      // The band is the top of the viewport, ignoring the sticky header.
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return <div className="toc" />;

  return (
    <div className="toc">
      <nav aria-label="On this page" className="toc-inner">
        <p className="toc-title">On this page</p>
        <ul className="toc-list">
          {headings.map((heading, index) => (
            // Keyed by position and not by id alone. Two headings with the same
            // text produce the same slug, and while that is a bug on the page
            // itself, it should not also crash the contents listing it.
            <li key={`${heading.id}-${index}`}>
              <a
                className="toc-link"
                data-active={activeId === heading.id ? "" : undefined}
                data-level={heading.level}
                href={`#${heading.id}`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
