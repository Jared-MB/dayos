import Link from "next/link";
import type { ReactNode } from "react";
import { plainText } from "../_lib/text";
import { DefaultValue, HeadingAnchor } from "./labels";

/**
 * The components a page's MDX is built from.
 *
 * Markdown covers the prose — paragraphs, lists, links, headings, code — and
 * `mdx-components.tsx` maps those onto the ones here. What is left is the
 * handful of things Markdown has no syntax for, and a page writes those as
 * tags: a callout, a props table, a numbered walkthrough, a grid of links.
 */

/**
 * A heading that can be linked to. The id is what the table of contents scrolls
 * to and what the anchor copies, so it is derived from the text rather than
 * written twice.
 */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function H2({ children }: { children: ReactNode }) {
  const heading = plainText(children);
  const id = slugify(heading);

  return (
    <h2 id={id}>
      <HeadingAnchor heading={heading} id={id} />
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  const heading = plainText(children);
  const id = slugify(heading);

  return (
    <h3 id={id}>
      <HeadingAnchor heading={heading} id={id} />
      {children}
    </h3>
  );
}

export type CalloutProps = {
  children: ReactNode;
  type?: "note" | "warning" | "good";
  title?: string;
};

/** The aside for the thing that would otherwise be a parenthesis three lines long. */
export function Callout({ children, type = "note", title }: CalloutProps) {
  return (
    <aside className="callout" data-type={type}>
      <div aria-hidden="true" className="callout-icon">
        {type === "warning" ? "!" : type === "good" ? "✓" : "i"}
      </div>
      <div className="callout-body">
        {title ? <p className="callout-title">{title}</p> : null}
        {children}
      </div>
    </aside>
  );
}

/**
 * The props of a component, as a table on a wide screen and as a stack of cards
 * on a narrow one — a five-column table on a phone is unreadable, and the API
 * reference is mostly tables.
 *
 * The rows are `<Prop>` children rather than an array of objects: a
 * description is a sentence, sometimes with a link or a code span in it, and
 * writing it between tags means it is written the same way as every other
 * sentence on the page.
 */
export function PropsTable({ children }: { children: ReactNode }) {
  return <div className="props-table">{children}</div>;
}

export type PropProps = {
  name: string;
  type: string;
  default?: string;
  children: ReactNode;
};

export function Prop({ name, type, default: value, children }: PropProps) {
  return (
    <div className="prop-row">
      <div className="prop-signature">
        <code className="prop-name">{name}</code>
        <code className="prop-type">{type}</code>
        {value ? <DefaultValue value={value} /> : null}
      </div>
      <div className="prop-description">{children}</div>
    </div>
  );
}

/** A numbered walkthrough, where each step is a heading plus whatever follows it. */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="steps">{children}</div>;
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="step">
      <h3 className="step-title" id={slugify(title)}>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** The grid of links at the end of a page, for where to go next. */
export function Cards({ children }: { children: ReactNode }) {
  return <div className="cards">{children}</div>;
}

export function Card({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link className="card" href={href} {...externalLink(href)}>
      <span className="card-title">
        {title}
        <span aria-hidden="true" className="card-arrow">
          →
        </span>
      </span>
      <span className="card-description">{children}</span>
    </Link>
  );
}

/**
 * A link in prose. Markdown writes them all the same way, so which kind it is
 * has to be read off the href: inside the site it is a client-side navigation,
 * outside it opens in a tab of its own.
 */
export function Anchor({
  href = "",
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  if (href.startsWith("#")) return <a href={href}>{children}</a>;

  return (
    <Link href={href} {...externalLink(href)}>
      {children}
    </Link>
  );
}

const externalLink = (href: string) =>
  href.startsWith("http") ? { rel: "noreferrer", target: "_blank" } : null;
