/**
 * The docs in plain text, for readers that are not a browser.
 *
 * Every page has a `.md` twin at its own URL, and the site has an `llms.txt`
 * index pointing at all of them. A model asked about DayOS can then be handed a
 * URL instead of a scrape of the rendered page — no navigation chrome, no
 * syntax-highlighting spans around every token of every example.
 *
 * The registry below is the one thing that has to be extended alongside a new
 * page. `nav.ts` says where a page sits; this says which module holds it, and
 * the two are checked against each other at build time by the route that walks
 * `PAGES` and asks for each one's content.
 */

import type { ReactNode } from "react";
import ApiCore from "../docs/api/core/page";
import ApiNext from "../docs/api/next/page";
import Composition from "../docs/composition/page";
import DesktopAndApps from "../docs/desktop-and-apps/page";
import Installation from "../docs/installation/page";
import Introduction from "../docs/page";
import QuickStart from "../docs/quick-start/page";
import DynamicRoutes from "../docs/routing/dynamic-routes/page";
import RouteMatching from "../docs/routing/matching/page";
import Routing from "../docs/routing/page";
import ServerRendering from "../docs/server-rendering/page";
import State from "../docs/state/page";
import Styling from "../docs/styling/page";
import Windows from "../docs/windows/page";
import { toMarkdown } from "./markdown";
import { findPage, markdownUrl, PAGES, SECTIONS, sectionOf } from "./nav";
import { REPOSITORY, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

const CONTENT: Record<string, () => ReactNode> = {
  "/docs": Introduction,
  "/docs/installation": Installation,
  "/docs/quick-start": QuickStart,
  "/docs/desktop-and-apps": DesktopAndApps,
  "/docs/windows": Windows,
  "/docs/styling": Styling,
  "/docs/composition": Composition,
  "/docs/state": State,
  "/docs/server-rendering": ServerRendering,
  "/docs/routing": Routing,
  "/docs/routing/dynamic-routes": DynamicRoutes,
  "/docs/routing/matching": RouteMatching,
  "/docs/api/core": ApiCore,
  "/docs/api/next": ApiNext,
};

/** The Markdown for one page, or `undefined` if nothing is registered for it. */
export function pageMarkdown(href: string): string | undefined {
  const page = findPage(href);
  const Content = CONTENT[href];

  if (!page || !Content) return undefined;

  const section = sectionOf(href);

  // Front matter rather than a prose preamble: the title and description are
  // the two things a reader wants before the body, and quoting them as YAML
  // means a colon in a description cannot break the file.
  const frontMatter = [
    "---",
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    ...(section ? [`section: ${JSON.stringify(section.title)}`] : []),
    `source: ${new URL(href, SITE_URL).toString()}`,
    "---",
  ].join("\n");

  return [
    frontMatter,
    `# ${page.title}`,
    page.description,
    toMarkdown(Content()),
  ]
    .join("\n\n")
    .concat("\n");
}

/**
 * The index at `/llms.txt`, in the shape the convention asks for: a heading, a
 * one-line summary, then the pages as links — pointed at the Markdown, so
 * following one costs a model a page of text rather than a page of markup.
 */
export function llmsTxt(): string {
  const sections = SECTIONS.map((section) =>
    [
      `## ${section.title}`,
      "",
      ...section.pages.map(
        (page) =>
          `- [${page.title}](${markdownUrl(page.href)}): ${page.description}`,
      ),
    ].join("\n"),
  );

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Every page below is also served as Markdown at its own URL, and the whole",
    `documentation is available as one file at ${SITE_URL}/llms-full.txt.`,
    "",
    ...sections.flatMap((section) => [section, ""]),
    "## Optional",
    "",
    `- [Source and issues](${REPOSITORY}): the repository, including the example desktop.`,
  ].join("\n");
}

/** Every page, in reading order, as one file. */
export function llmsFullTxt(): string {
  return PAGES.map((page) => pageMarkdown(page.href))
    .filter((markdown) => markdown !== undefined)
    .join("\n---\n\n");
}
