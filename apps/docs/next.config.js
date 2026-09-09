import { fileURLToPath } from "node:url";
import createMDX from "@next/mdx";

/**
 * The docs are written in two languages and served from one route tree, which
 * lives under `app/[lang]`. Spanish reaches it directly at `/es/...`; English
 * reaches it through the rewrites below, which map the bare paths onto the
 * `en` segment.
 *
 * Rewrites and not redirects, because the point is that English keeps the URLs
 * it already had: `/docs/windows` stays `/docs/windows` in the address bar, in
 * a bookmark and in whatever already links to it.
 *
 * `/en/docs/windows` also resolves, since it is the real path. It is left
 * reachable rather than redirected away — a redirect on `/en/:path*` would also
 * catch the generated Open Graph images, and the pages already name their
 * unprefixed twin as `canonical`, which is what tells a crawler the two
 * addresses are one page.
 *
 * Each source is written out rather than caught by one pattern: a catch-all
 * here would also swallow `/_next`, `/favicon.ico`, `/sitemap.xml` and
 * `/robots.txt`, none of which live under a language.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async rewrites() {
    return {
      // Before the filesystem, so these win over anything that would otherwise
      // match `[lang]` — `/docs` would be read as the language "docs".
      beforeFiles: [
        { source: "/", destination: "/en" },
        { source: "/docs", destination: "/en/docs" },
        { source: "/docs.md", destination: "/en/docs.md" },
        { source: "/docs/:path*", destination: "/en/docs/:path*" },
        { source: "/llms.txt", destination: "/en/llms.txt" },
        { source: "/llms-full.txt", destination: "/en/llms-full.txt" },
      ],
    };
  },
};

/**
 * The pages' prose is MDX, sitting beside the route that renders it. `.mdx` is
 * deliberately absent from `pageExtensions`: a page is still a `page.tsx`,
 * which is what picks the reader's language out of the two files next to it.
 * The MDX is imported, never routed to.
 */
const withMDX = createMDX({
  options: {
    // A path and not the function itself: Turbopack runs the MDX loader in a
    // worker, so everything it is handed has to survive being serialized. A
    // published plugin can be named, since the loader resolves it against this
    // project; a local one is given as an absolute path, because a relative
    // one would be resolved from inside `@next/mdx` instead.
    //
    // The front matter at the top of every page is the page's title and
    // description. This keeps it out of the rendered prose, where the three
    // dashes would otherwise come through as a rule; `docs.ts` is what reads
    // the values back out.
    remarkPlugins: ["remark-frontmatter"],
    rehypePlugins: [
      [fileURLToPath(new URL("mdx/rehype-code-meta.mjs", import.meta.url)), {}],
      [fileURLToPath(new URL("mdx/rehype-brand-names.mjs", import.meta.url)), {}],
    ],
  },
});

/**
 * Annotated rather than inferred. `withMDX` comes from `@next/mdx`, which
 * resolves `next` in its own tree, so the type it returns is only nameable
 * through a path into `.pnpm` — which is what TS2742 objects to. Saying what
 * the type is, out of this package's own `next`, is what makes it portable.
 *
 * @type {import("next").NextConfig}
 */
const config = withMDX(nextConfig);

export default config;
