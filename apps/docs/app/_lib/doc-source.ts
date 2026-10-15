/**
 * The docs in plain text, for readers that are not a browser.
 *
 * Every page has a `.md` twin at its own URL, and each language has an
 * `llms.txt` index pointing at its own. A model asked about DayOS can then be
 * handed a URL instead of a scrape of the rendered page — no navigation chrome,
 * no syntax-highlighting spans around every token of every example.
 *
 * Nothing here holds a second copy of anything. `nav.ts` says which pages
 * exist and in what order; each page's `.mdx` says what it is called and what
 * it says, front matter and prose in the one file. So the Markdown a model is
 * handed and the page a reader sees are two views of the same document, and
 * neither can drift from the other.
 */

import { dictionary } from "./dictionary";
import { readDocument, sectionOf, sections } from "./docs";
import { LOCALE_NAMES, LOCALES, type Locale, localePath } from "./i18n";
import { mdxToMarkdown } from "./mdx-markdown";
import { HREFS, markdownUrl } from "./nav";
import { REPOSITORY, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

const absolute = (path: string) => new URL(path, SITE_URL).toString();

/**
 * The Markdown for one page, or `undefined` if the outline has no such page.
 */
export function pageMarkdown(locale: Locale, href: string): string | undefined {
  if (!HREFS.includes(href)) return undefined;

  const { title, description, body } = readDocument(locale, href);
  const section = sectionOf(locale, href);

  // Front matter rather than a prose preamble: the title and description are
  // the two things a reader wants before the body, and quoting them as YAML
  // means a colon in a description cannot break the file.
  //
  // `language` is in there because these files travel: one pasted into a
  // context window alongside another is otherwise two documents that disagree,
  // rather than the same document twice.
  const frontMatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    // A page that gives no description says nothing rather than saying
    // "undefined": the key is optional, and an absent one is the honest shape.
    ...(description ? [`description: ${JSON.stringify(description)}`] : []),
    ...(section ? [`section: ${JSON.stringify(section.title)}`] : []),
    `language: ${JSON.stringify(locale)}`,
    `source: ${absolute(localePath(locale, href))}`,
    "---",
  ].join("\n");

  return [
    frontMatter,
    `# ${title}`,
    ...(description ? [description] : []),
    mdxToMarkdown(body, locale),
  ]
    .join("\n\n")
    .concat("\n");
}

/**
 * The index at `/llms.txt`, in the shape the convention asks for: a heading, a
 * one-line summary, then the pages as links — pointed at the Markdown, so
 * following one costs a model a page of text rather than a page of markup.
 *
 * Each language gets its own index under its own prefix, and every one of them
 * ends by naming the others: a model handed the Spanish index should be able to
 * find the English pages without having to guess that they exist.
 */
export function llmsTxt(locale: Locale): string {
  const d = dictionary(locale);

  const list = sections(locale).map((section) =>
    [
      `## ${section.title}`,
      "",
      ...section.pages.map((page) => {
        const link = `- [${page.title}](${markdownUrl(locale, page.href)})`;

        return page.description ? `${link}: ${page.description}` : link;
      }),
    ].join("\n"),
  );

  const others = LOCALES.filter((other) => other !== locale).map(
    (other) =>
      `- [${LOCALE_NAMES[other]}](${absolute(localePath(other, "/llms.txt"))})`,
  );

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION[locale]}`,
    "",
    d.llms.everyPage(absolute(localePath(locale, "/llms-full.txt"))),
    "",
    ...list.flatMap((section) => [section, ""]),
    `## ${d.llms.otherLanguages}`,
    "",
    ...others,
    "",
    `## ${d.llms.optional}`,
    "",
    `- [${d.llms.source}](${REPOSITORY}): ${d.llms.sourceDescription}`,
  ].join("\n");
}

/** Every page in one language, in reading order, as one file. */
export function llmsFullTxt(locale: Locale): string {
  return HREFS.map((href) => pageMarkdown(locale, href))
    .filter((markdown) => markdown !== undefined)
    .join("\n---\n\n");
}
