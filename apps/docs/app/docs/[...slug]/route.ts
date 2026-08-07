import { pageMarkdown } from "../../_lib/doc-source";
import { markdownResponse } from "../../_lib/markdown-response";
import { PAGES } from "../../_lib/nav";

/**
 * `/docs/installation.md`, and the same for every page under `/docs`.
 *
 * A catch-all sits below the static routes, so it is reached only by paths no
 * page claims — which is every `.md` twin and nothing else. Every one of them
 * is listed by `generateStaticParams`, and `dynamicParams` closes the door on
 * the rest: `/docs/anything` stays a 404 rather than becoming this handler's
 * problem.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PAGES.filter((page) => page.href !== "/docs").map((page) => {
    const segments = page.href.replace("/docs/", "").split("/");
    const last = segments.length - 1;

    return {
      slug: [...segments.slice(0, last), `${segments[last]}.md`],
    };
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const markdown = pageMarkdown(`/docs/${slug.join("/")}`.replace(/\.md$/, ""));

  if (!markdown) return new Response("Not found", { status: 404 });

  return markdownResponse(markdown);
}
