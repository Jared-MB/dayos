/**
 * A doc page, as Markdown.
 *
 * The pages are TSX rather than MDX, so there is no Markdown source sitting on
 * disk to hand to a reader — or to a model. This walks the element tree a page
 * returns and writes one.
 *
 * It never renders anything: a page component called by hand gives back plain
 * data, and every component the docs are built from is named here by identity,
 * so a `<Callout>` becomes a blockquote rather than a `<div>` someone has to
 * parse back out of HTML. Anything unrecognised falls through to its children,
 * which means a new wrapper degrades to its content instead of throwing.
 */

import Link from "next/link";
import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  CodeBlock,
  type CodeBlockProps,
  InlineCode,
} from "../_components/code";
import { DocPage } from "../_components/doc-page";
import {
  Callout,
  type CalloutProps,
  Card,
  Cards,
  H2,
  H3,
  type PropRow,
  PropsTable,
  Step,
  Steps,
} from "../_components/prose";
import { SITE_URL } from "./site";

/** Everything that becomes its own block, and so ends an inline run. */
const BLOCK_TYPES = new Set<unknown>([
  Fragment,
  DocPage,
  H2,
  H3,
  Steps,
  Step,
  Cards,
  Card,
  CodeBlock,
  Callout,
  PropsTable,
  "p",
  "ul",
  "ol",
  "hr",
  "div",
  "section",
  "aside",
  "figure",
]);

/** GitHub renders these as coloured alerts, and they read as prose everywhere else. */
const ALERTS = { note: "NOTE", warning: "WARNING", good: "TIP" } as const;

export function toMarkdown(node: ReactNode): string {
  return content(node).join("\n\n");
}

/**
 * A run of children as blocks. Prose and blocks are mixed freely in a page —
 * a paragraph, a code block, two more sentences — so the inline runs are
 * gathered up and flushed whenever a block interrupts them.
 */
function content(node: ReactNode): string[] {
  const out: string[] = [];
  let run: ReactNode[] = [];

  const flush = () => {
    const text = collapse(inline(run)).trim();
    if (text) out.push(text);
    run = [];
  };

  for (const child of Children.toArray(node)) {
    if (isValidElement(child) && BLOCK_TYPES.has(child.type)) {
      flush();
      out.push(...block(child));
    } else {
      run.push(child);
    }
  }

  flush();
  return out;
}

function block(element: ReactElement): string[] {
  const props = element.props as Record<string, unknown>;
  const children = props.children as ReactNode;

  // Decorative markup — an icon glyph, an arrow — says nothing once the styling
  // is gone, and it is already marked as saying nothing.
  if (props["aria-hidden"]) return [];

  const { type } = element;

  if (type === Fragment || type === DocPage || type === Steps) {
    return content(children);
  }

  if (type === H2) return [`## ${text(children)}`];
  if (type === H3) return [`### ${text(children)}`];
  if (type === Step) return [`### ${props.title}`, ...content(children)];
  if (type === CodeBlock) return [fence(props as unknown as CodeBlockProps)];
  if (type === Callout) return [callout(props as unknown as CalloutProps)];
  if (type === PropsTable) return [table(props.rows as readonly PropRow[])];

  // The grid of "where to go next" links, as the list it always was.
  if (type === Cards) return [content(children).join("\n")];
  if (type === Card) {
    return [
      `- [${props.title}](${absolute(String(props.href))}) — ${text(children)}`,
    ];
  }

  if (type === "ul" || type === "ol") return [list(children, type === "ol")];
  if (type === "hr") return ["---"];

  return content(children);
}

/**
 * Inline content as a string. `literal` is set inside a code span, where the
 * text stands for itself and escaping it would be part of what the reader
 * copies.
 */
function inline(node: ReactNode, literal = false): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "number") return String(node);
  if (typeof node === "string") return literal ? node : escapeTags(node);
  if (Array.isArray(node))
    return node.map((child) => inline(child, literal)).join("");
  if (!isValidElement(node)) return "";

  const props = node.props as Record<string, unknown>;
  const children = props.children as ReactNode;

  if (props["aria-hidden"]) return "";

  const { type } = node;

  if (type === InlineCode || type === "code" || type === "kbd") {
    return `\`${collapse(inline(children, true)).trim()}\``;
  }

  if (type === "strong" || type === "b")
    return `**${inline(children, literal)}**`;
  if (type === "em" || type === "i") return `_${inline(children, literal)}_`;
  if (type === "br") return "\n";

  if (type === Link || type === "a") {
    return `[${inline(children, literal)}](${absolute(String(props.href))})`;
  }

  return inline(children, literal);
}

function list(children: ReactNode, ordered: boolean): string {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((item, index) => {
      const marker = ordered ? `${index + 1}. ` : "- ";
      const body = content((item.props as { children?: ReactNode }).children);

      // Continuation lines sit under the marker, not beside it: a code block
      // in a list item that starts in column zero ends the list instead.
      return body
        .join("\n\n")
        .split("\n")
        .map((line, lineIndex) =>
          lineIndex === 0
            ? marker + line
            : line && " ".repeat(marker.length) + line,
        )
        .join("\n");
    })
    .join("\n");
}

function fence({
  children,
  language = "tsx",
  filename,
  added,
  removed,
}: CodeBlockProps): string {
  const code = children.replace(/\n$/, "");
  const isDiff = Boolean(added?.length || removed?.length);

  const body = isDiff
    ? code
        .split("\n")
        .map((line, index) => {
          const marker = added?.includes(index + 1)
            ? "+"
            : removed?.includes(index + 1)
              ? "-"
              : " ";

          return marker + line;
        })
        .join("\n")
    : code;

  // Long enough to survive a block that itself contains a fence.
  const ticks = "`".repeat(
    Math.max(
      3,
      ...[...body.matchAll(/`+/g)].map((match) => match[0].length + 1),
    ),
  );
  const info = isDiff ? "diff" : language;

  return `${ticks}${info}${filename ? ` title="${filename}"` : ""}\n${body}\n${ticks}`;
}

function callout({ children, type = "note", title }: CalloutProps): string {
  const body = [...(title ? [`**${title}**`] : []), ...content(children)];

  // The marker takes the line above the first one, with no blank between them:
  // a gap there is a blockquote that happens to start with `[!NOTE]` rather
  // than an alert.
  return `[!${ALERTS[type]}]\n${body.join("\n\n")}`
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

/**
 * The rows read as a table here, where on the page they are a stack of
 * signatures. "Name" rather than "Prop": the same component describes data
 * attributes and hook return values.
 */
function table(rows: readonly PropRow[]): string {
  const cell = (value: string) => collapse(value).replaceAll("|", "\\|").trim();
  const row = (cells: readonly string[]) => `| ${cells.join(" | ")} |`;

  return [
    row(["Name", "Type", "Default", "Description"]),
    row(["---", "---", "---", "---"]),
    ...rows.map((entry) =>
      row([
        `\`${cell(entry.name)}\``,
        `\`${cell(entry.type)}\``,
        entry.default ? `\`${cell(entry.default)}\`` : "—",
        cell(content(entry.description).join(" ")),
      ]),
    ),
  ].join("\n");
}

const collapse = (value: string) => value.replace(/\s+/g, " ");

/**
 * What would otherwise be read as a tag. The docs talk about `<div>` and
 * `<Window>` in the middle of sentences, and a renderer handed those swallows
 * them — while `a < b` is arithmetic and stays as it is.
 */
const escapeTags = (value: string) => value.replace(/<(?=[a-zA-Z/!])/g, "&lt;");

/** Inline content flattened to a single line, for a heading or a table cell. */
const text = (node: ReactNode) => collapse(inline(node)).trim();

/**
 * Site-relative links are resolved against the live site. The Markdown is read
 * away from the page it came from — in a terminal, in a model's context — where
 * `/docs/routing` is not a link to anywhere.
 */
const absolute = (href: string) =>
  href.startsWith("/") ? new URL(href, SITE_URL).toString() : href;
