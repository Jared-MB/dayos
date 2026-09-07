/**
 * A page's `.mdx`, as the Markdown twin served at its `.md` address.
 *
 * The pages are Markdown to begin with, so most of this file is the part that
 * leaves lines alone. What is left is the handful of tags Markdown has no
 * syntax for — a callout, a props table, a walkthrough, a grid of links — and
 * each of them has an obvious plain-text shape: a GitHub alert, a table, a
 * heading, a list. A tag nobody has taught it about falls through to its
 * contents, so a new wrapper degrades to its words instead of throwing.
 *
 * Reading the source rather than walking the rendered tree is what keeps the
 * two versions of a page in step: there is one document, and this is a view of
 * it. It also means a fence arrives with its code untouched, rather than as a
 * few hundred syntax-highlighting spans that have to be flattened back.
 */

import { dictionary } from "./dictionary";
import { parseFenceMeta } from "./fence-meta";
import type { Locale } from "./i18n";
import { SITE_URL } from "./site";

/** GitHub renders these as coloured alerts, and they read as prose everywhere else. */
const ALERTS = { note: "NOTE", warning: "WARNING", good: "TIP" } as const;

export function mdxToMarkdown(source: string, locale: Locale): string {
  return blocks(source.split("\n"), locale).trimEnd();
}

/**
 * A run of lines, in order. Anything that is already Markdown is copied across
 * as it stands; a fence and a component are the two things that are read.
 */
function blocks(input: readonly string[], locale: Locale): string {
  const out: string[] = [];
  let index = 0;

  while (index < input.length) {
    const line = input[index] ?? "";
    const fence = line.match(/^(\s*)(`{3,})(.*)$/);

    if (fence) {
      const [, indent = "", ticks = "```", info = ""] = fence;
      const close = input.findIndex(
        (candidate, at) => at > index && candidate.trim() === ticks,
      );
      const end = close === -1 ? input.length : close;

      out.push(codeFence(info, input.slice(index + 1, end), indent));
      index = end + 1;
      continue;
    }

    // An `import` or `export`, which is code and not prose. Pages rarely have
    // one — the components they use are in scope everywhere — but a page that
    // does should not have it turn up in the middle of the writing. It runs to
    // the next blank line, which is where MDX ends a statement too; the check
    // happens here rather than over the whole file so that an `import` inside
    // a code sample stays in the sample.
    if (/^(?:import|export)\s/.test(line)) {
      while (index < input.length && (input[index] ?? "").trim().length > 0) {
        index += 1;
      }

      continue;
    }

    // A note to whoever edits the page next, which is not part of the page.
    if (/^\s*\{\/\*/.test(line)) {
      const close = input.findIndex(
        (candidate, at) => at >= index && candidate.includes("*/}"),
      );

      index = (close === -1 ? input.length : close) + 1;

      // And the blank line under it, which was separating the note from the
      // page rather than one part of the page from another.
      if ((input[index] ?? "").trim().length === 0) index += 1;

      continue;
    }

    const open = line.match(/^\s*<([A-Z][\w]*)/);

    if (open?.[1]) {
      const element = readElement(input, index, open[1]);

      out.push(render(element, locale));
      index = element.end;
      continue;
    }

    out.push(text(line));
    index += 1;
  }

  return out.join("\n");
}

type Element = {
  tag: string;
  attributes: Record<string, string>;
  children: readonly string[];
  /** The line after the element, where reading picks up again. */
  end: number;
};

/**
 * One component, from its opening tag to its closing one.
 *
 * The closing tag is found by its own line rather than by counting: every
 * component the docs use is written as a block, and none of them nests inside
 * another of the same name — `<PropsTable>` holds `<Prop>`, `<Steps>` holds
 * `<Step>`. Were that to change this is the line that would have to know.
 */
function readElement(
  input: readonly string[],
  start: number,
  tag: string,
): Element {
  let open = input[start] ?? "";
  let cursor = start;

  // An opening tag with several attributes is usually written over several
  // lines, so it runs until the `>` that ends it — the first one outside a
  // quoted value, since a type like `React.ComponentProps<"div">` has one of
  // its own.
  while (endOfTag(open) === -1 && cursor + 1 < input.length) {
    cursor += 1;
    open += `\n${input[cursor]}`;
  }

  const attributes: Record<string, string> = {};

  for (const [, name, double, single] of open.matchAll(
    /([\w-]+)=(?:"([^"]*)"|'([^']*)')/g,
  )) {
    if (name) attributes[name] = double ?? single ?? "";
  }

  const tagEnd = endOfTag(open);

  if (tagEnd !== -1 && open.slice(0, tagEnd).trimEnd().endsWith("/")) {
    return { tag, attributes, children: [], end: cursor + 1 };
  }

  const closing = new RegExp(`^\\s*</${tag}>\\s*$`);
  const close = input.findIndex(
    (candidate, at) => at > cursor && closing.test(candidate),
  );
  const end = close === -1 ? input.length : close;

  return {
    tag,
    attributes,
    children: trim(dedent(input.slice(cursor + 1, end))),
    end: end + 1,
  };
}

/** Where an opening tag ends, ignoring the `>` inside a quoted attribute. */
function endOfTag(open: string): number {
  let quote = "";

  for (let at = 0; at < open.length; at += 1) {
    const character = open[at] as string;

    if (quote) {
      if (character === quote) quote = "";
      continue;
    }

    if (character === '"' || character === "'") quote = character;
    else if (character === ">") return at;
  }

  return -1;
}

function render(element: Element, locale: Locale): string {
  const { tag, attributes, children } = element;

  if (tag === "Callout") return callout(element, locale);
  if (tag === "PropsTable") return propsTable(children, locale);

  // The wrappers carry the layout and nothing else: what is inside them is
  // already a run of blocks.
  if (tag === "Steps" || tag === "Cards") return blocks(children, locale);

  if (tag === "Step") {
    return [`### ${attributes.title ?? ""}`, "", blocks(children, locale)].join(
      "\n",
    );
  }

  if (tag === "Card") {
    return `- [${attributes.title ?? ""}](${absolute(attributes.href ?? "")}) — ${sentence(children)}`;
  }

  return blocks(children, locale);
}

function callout({ attributes, children }: Element, locale: Locale): string {
  const type = (attributes.type ?? "note") as keyof typeof ALERTS;
  const title = attributes.title ? [`**${attributes.title}**`, ""] : [];
  const body = [...title, blocks(children, locale)].join("\n").trim();

  // The marker takes the line above the first one, with no blank between them:
  // a gap there is a blockquote that happens to start with `[!NOTE]` rather
  // than an alert.
  return `[!${ALERTS[type] ?? "NOTE"}]\n${body}`
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

/**
 * The `<Prop>` rows as a table, where on the page they are a stack of
 * signatures. "Name" rather than "Prop": the same component describes data
 * attributes and hook return values. The four headings are the site's own
 * words rather than the page's, so they come from the dictionary.
 */
function propsTable(children: readonly string[], locale: Locale): string {
  const d = dictionary(locale);
  const row = (cells: readonly string[]) => `| ${cells.join(" | ")} |`;
  const cell = (value: string) => value.replaceAll("|", "\\|");

  const rows: string[] = [];
  let index = 0;

  while (index < children.length) {
    const open = children[index]?.match(/^\s*<(Prop)(?![\w])/);

    if (!open) {
      index += 1;
      continue;
    }

    const prop = readElement(children, index, "Prop");

    rows.push(
      row([
        `\`${cell(prop.attributes.name ?? "")}\``,
        `\`${cell(prop.attributes.type ?? "")}\``,
        prop.attributes.default ? `\`${cell(prop.attributes.default)}\`` : "—",
        cell(sentence(prop.children)),
      ]),
    );

    index = prop.end;
  }

  return [
    row([d.table.name, d.table.type, d.table.default, d.table.description]),
    row(["---", "---", "---", "---"]),
    ...rows,
  ].join("\n");
}

/** A few lines of prose flattened onto one, for a table cell or a list item. */
const sentence = (input: readonly string[]) =>
  text(input.join(" ")).replace(/\s+/g, " ").trim();

/**
 * The two things a line of prose needs on its way out.
 *
 * `<kbd>` is the one tag the pages write inline, and a key is a code span
 * everywhere that has no styling. Site-relative links are resolved against the
 * live site, because the Markdown is read away from the page it came from — in
 * a terminal, in a model's context — where `/docs/routing` links to nothing.
 */
const text = (line: string) =>
  line
    .replace(/<kbd>(.*?)<\/kbd>/g, "`$1`")
    .replace(/\]\((\/[^)\s]*)\)/g, (_, href: string) => `](${absolute(href)})`);

/**
 * A fence, with the diff it may be describing spelled out. `added` and
 * `removed` are line numbers on the page, where the styling says which is
 * which; in plain text the marker in the margin has to say it.
 */
function codeFence(
  info: string,
  body: readonly string[],
  indent: string,
): string {
  const [language = "tsx", ...rest] = info.trim().split(/\s+/);
  const meta = parseFenceMeta(rest.join(" "));
  const isDiff = Boolean(meta.added?.length || meta.removed?.length);

  const code = isDiff
    ? body.map((line, at) => {
        const marker = meta.added?.includes(at + 1)
          ? "+"
          : meta.removed?.includes(at + 1)
            ? "-"
            : " ";

        return marker + line;
      })
    : body;

  // Long enough to survive a block that itself contains a fence.
  const ticks = "`".repeat(
    Math.max(
      3,
      ...code
        .flatMap((line) => [...line.matchAll(/`+/g)])
        .map((match) => match[0].length + 1),
    ),
  );

  const header = `${isDiff ? "diff" : language}${meta.filename ? ` title="${meta.filename}"` : ""}`;

  return [`${ticks}${header}`, ...code, ticks]
    .map((line) => (line ? indent + line : line))
    .join("\n");
}

/** Inner lines, with the indentation the tag around them added back out. */
function dedent(input: readonly string[]): string[] {
  const widths = input
    .filter((line) => line.trim().length > 0)
    .map((line) => (line.match(/^\s*/)?.[0] ?? "").length);

  const width = widths.length > 0 ? Math.min(...widths) : 0;

  return input.map((line) => line.slice(width));
}

/**
 * The blank lines a tag leaves behind. A component is written with its content
 * set off from the tags around it, and dropping the wrapper would otherwise
 * leave that breathing room stacked on top of the blank lines already either
 * side of the element.
 */
function trim(input: readonly string[]): string[] {
  const from = input.findIndex((line) => line.trim().length > 0);

  if (from === -1) return [];

  let to = input.length - 1;

  while (to > from && (input[to] ?? "").trim().length === 0) to -= 1;

  return input.slice(from, to + 1);
}

const absolute = (href: string) =>
  href.startsWith("/") ? new URL(href, SITE_URL).toString() : href;
