/**
 * The docs in plain text, for readers that are not a browser.
 *
 * Every page has a `.md` twin at its own URL, and each language has an
 * `llms.txt` index pointing at its own. A model asked about DayOS can then be
 * handed a URL instead of a scrape of the rendered page — no navigation chrome,
 * no syntax-highlighting spans around every token of every example.
 *
 * Nothing here holds a second list of pages, and nothing imports the pages
 * either. `nav.ts` says which pages exist and what they are called; an href
 * says where its writing lives, because a page's route and its prose are the
 * same folder. Reading that file is all it takes to hand out the page.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dictionary } from "./dictionary";
import { LOCALE_NAMES, LOCALES, type Locale, localePath } from "./i18n";
import { mdxToMarkdown } from "./mdx-markdown";
import { findPage, HREFS, markdownUrl, sectionOf, sections } from "./nav";
import { REPOSITORY, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

const absolute = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Where a page's prose is written: beside the `page.tsx` that renders it, named
 * for the language it is written in. `/docs/routing/matching` in Spanish is
 * `app/[lang]/docs/routing/matching/es.mdx`, and there is nowhere else to look.
 */
export const sourcePath = (locale: Locale, href: string) =>
  join(process.cwd(), "app", "[lang]", href, `${locale}.mdx`);

/**
 * The Markdown for one page, or `undefined` if it has no entry in `nav.ts`.
 *
 * A page that is listed but has no `.mdx` beside its route throws rather than
 * going quiet: these run while the site is being built, so a translation
 * nobody has written yet is a failed build and not a blank page.
 */
export function pageMarkdown(locale: Locale, href: string): string | undefined {
  const page = findPage(locale, href);

  if (!page) return undefined;

  const source = readFileSync(sourcePath(locale, href), "utf8");
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
    `title: ${JSON.stringify(page.title)}`,
    // A page whose entry has no description says nothing rather than saying
    // "undefined": the key is optional, and an absent one is the honest shape.
    ...(page.description
      ? [`description: ${JSON.stringify(page.description)}`]
      : []),
    ...(section ? [`section: ${JSON.stringify(section.title)}`] : []),
    `language: ${JSON.stringify(locale)}`,
    `source: ${absolute(localePath(locale, href))}`,
    "---",
  ].join("\n");

  return [
    frontMatter,
    `# ${page.title}`,
    ...(page.description ? [page.description] : []),
    mdxToMarkdown(source, locale),
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
