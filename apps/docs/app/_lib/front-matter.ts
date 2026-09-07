/**
 * The block at the top of every page's `.mdx`, and the page's own account of
 * what it is called.
 *
 * The title and the description are rendered above the prose, so they are
 * written where the prose is: opening `es.mdx` shows the whole of what the
 * reader will see, and translating a page is editing one file. Nothing else
 * knows a page's title — the sidebar, the search box, the `<title>` and the
 * Markdown twin all end up here.
 *
 * The grammar is the small corner of YAML these three keys need: `key: value`,
 * a value that may be carried onto the next lines by indenting them, and
 * quotes for a value that would otherwise be ambiguous. It is read by hand
 * rather than by a YAML library because the block is three keys long and the
 * dependency would be larger than the file it parses.
 */

export type FrontMatter = {
  title: string;
  description?: string;
  /** Extra words a reader might search for that don't appear in the title. */
  keywords?: readonly string[];
};

/** What the page says about itself, and the prose underneath it. */
export type Document = FrontMatter & { body: string };

const DELIMITER = "---";

/**
 * Values are plain text, except when the text would read as something else.
 * A description containing `: ` is not a valid plain YAML scalar, so those are
 * written quoted; unwrapping them here is what lets the block stay YAML rather
 * than becoming a private format that happens to look like it.
 */
const value = (raw: string) =>
  raw.startsWith('"') ? (JSON.parse(raw) as string) : raw;

const list = (raw: string) =>
  raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

/**
 * The front matter and the body of one page. `where` is only ever used to say
 * which file is at fault: these run at build time, so a page that forgets its
 * title should stop the build rather than render a heading that says nothing.
 */
export function parseDocument(source: string, where: string): Document {
  const lines = source.split("\n");

  if ((lines[0] ?? "").trim() !== DELIMITER) {
    throw new Error(
      `DayOS docs: ${where} does not start with a front matter block. Give it a "---" line, a "title:", and a closing "---".`,
    );
  }

  const end = lines.findIndex(
    (line, at) => at > 0 && line.trim() === DELIMITER,
  );

  if (end === -1) {
    throw new Error(
      `DayOS docs: the front matter in ${where} is never closed. Add a "---" line under the last key.`,
    );
  }

  const fields = new Map<string, string>();
  let key: string | undefined;

  for (const line of lines.slice(1, end)) {
    const field = line.match(/^([a-z]+):[ \t]*(.*)$/);

    if (field) {
      const [, name = "", first = ""] = field;
      key = name;
      fields.set(name, first.trim());
      continue;
    }

    // An indented line continues the value above it, so a long description can
    // be wrapped like the prose it describes instead of running off the edge.
    if (key && /^\s+\S/.test(line)) {
      fields.set(key, `${fields.get(key) ?? ""} ${line.trim()}`.trim());
      continue;
    }

    if (line.trim().length > 0) {
      throw new Error(
        `DayOS docs: ${where} has a line in its front matter that is neither a "key: value" nor an indented continuation: ${JSON.stringify(line)}`,
      );
    }
  }

  const title = fields.get("title");

  if (!title) {
    throw new Error(
      `DayOS docs: ${where} has no "title:" in its front matter. The title heads the page and names it everywhere else, so there is no sensible default.`,
    );
  }

  const description = fields.get("description");
  const keywords = fields.get("keywords");

  return {
    title: value(title),
    // A key left out and a key left empty mean the same thing: this page has
    // no description. Saying so with `undefined` keeps `description:` out of
    // the Markdown twin rather than putting an empty one there.
    ...(description ? { description: value(description) } : null),
    ...(keywords ? { keywords: list(keywords) } : null),
    body: lines
      .slice(end + 1)
      .join("\n")
      .replace(/^\n+/, ""),
  };
}
