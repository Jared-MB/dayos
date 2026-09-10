import type { MDXComponents } from "mdx/types";
import { CodeFence, InlineCode } from "./app/_components/code";
import {
  Anchor,
  Callout,
  Card,
  Cards,
  H2,
  H3,
  Prop,
  PropsTable,
  Step,
  Steps,
} from "./app/_components/prose";

/**
 * What the Markdown in a page becomes, and what a page can write without
 * importing anything.
 *
 * The first half is the mapping: a `##` is the heading with an anchor beside
 * it, a fence is the highlighted block with its copy button, a link is a
 * client-side navigation unless it leaves the site. Writing a page is then
 * writing Markdown, and the components it turns into are decided once, here,
 * rather than tag by tag on every page.
 *
 * The second half is everything Markdown has no syntax for. They are in scope
 * in every `.mdx` file, so a callout is `<Callout>` and not an import plus a
 * `<Callout>` — which matters most for the translations, where the file next
 * door should differ only in its words.
 */
const COMPONENTS: MDXComponents = {
  h2: H2,
  h3: H3,
  a: Anchor,
  pre: CodeFence,
  code: InlineCode,

  Callout,
  PropsTable,
  Prop,
  Steps,
  Step,
  Cards,
  Card,
};

/**
 * Next's own file convention: the name is fixed, and it takes no arguments.
 */
export function useMDXComponents(): MDXComponents {
  return COMPONENTS;
}
