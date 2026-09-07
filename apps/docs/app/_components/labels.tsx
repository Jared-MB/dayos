"use client";

import { useDictionary } from "./locale-provider";

/**
 * The two words in `prose.tsx` that belong to the site rather than to the page.
 *
 * Everything else in a doc page is written once per language, in the `.mdx`
 * beside its route, so it needs no lookup. These two do not appear in the
 * writing at all: the anchor beside a heading is a `#` with a name only a
 * screen reader hears, and the label before a default value is the table's own
 * wording. They live here, in the browser's half of the tree, because that is
 * where the language is readable without putting a `lang` prop on every heading
 * in the docs.
 */

export function HeadingAnchor({
  id,
  heading,
}: {
  id: string;
  heading: string;
}) {
  const d = useDictionary();

  return (
    <a
      aria-label={d.prose.headingAnchor(heading)}
      className="heading-anchor"
      href={`#${id}`}
    >
      #
    </a>
  );
}

export function DefaultValue({ value }: { value: string }) {
  const d = useDictionary();

  return (
    <span className="prop-default">
      {d.prose.default} <code>{value}</code>
    </span>
  );
}
