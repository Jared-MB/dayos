import Link from "next/link";
import { InlineCode } from "./code";

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

export function H2({ children }: { children: string }) {
  const id = slugify(children);

  return (
    <h2 id={id}>
      <a
        aria-label={`Link to ${children}`}
        className="heading-anchor"
        href={`#${id}`}
      >
        #
      </a>
      {children}
    </h2>
  );
}

export function H3({ children }: { children: string }) {
  const id = slugify(children);

  return (
    <h3 id={id}>
      <a
        aria-label={`Link to ${children}`}
        className="heading-anchor"
        href={`#${id}`}
      >
        #
      </a>
      {children}
    </h3>
  );
}

export type CalloutProps = {
  children: React.ReactNode;
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

export type PropRow = {
  name: string;
  type: string;
  default?: string;
  description: React.ReactNode;
};

/**
 * The props of a component, as a table on a wide screen and as a stack of cards
 * on a narrow one — a five-column table on a phone is unreadable, and the API
 * reference is mostly tables.
 */
export function PropsTable({ rows }: { rows: readonly PropRow[] }) {
  return (
    <div className="props-table">
      {rows.map((row) => (
        <div className="prop-row" key={row.name}>
          <div className="prop-signature">
            <code className="prop-name">{row.name}</code>
            <code className="prop-type">{row.type}</code>
            {row.default ? (
              <span className="prop-default">
                default <code>{row.default}</code>
              </span>
            ) : null}
          </div>
          <div className="prop-description">{row.description}</div>
        </div>
      ))}
    </div>
  );
}

/** A numbered walkthrough, where each step is a heading plus whatever follows it. */
export function Steps({ children }: { children: React.ReactNode }) {
  return <div className="steps">{children}</div>;
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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
export function Cards({ children }: { children: React.ReactNode }) {
  return <div className="cards">{children}</div>;
}

export function Card({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");

  return (
    <Link
      className="card"
      href={href}
      {...(isExternal ? { rel: "noreferrer", target: "_blank" } : null)}
    >
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

/** `<code>` in prose, exported here so pages import their primitives from one place. */
export { InlineCode as Code };
