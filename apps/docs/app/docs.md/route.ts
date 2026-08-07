import { pageMarkdown } from "../_lib/doc-source";
import { markdownResponse } from "../_lib/markdown-response";

// The content is fixed at build time, so this is a file and not a request.
export const dynamic = "force-static";

/**
 * The docs index, as Markdown. It sits here rather than under the catch-all
 * next door because `/docs.md` is not a path below `/docs` — the one page whose
 * twin is a sibling instead of a child.
 */
export function GET() {
  const markdown = pageMarkdown("/docs");

  if (!markdown) return new Response("Not found", { status: 404 });

  return markdownResponse(markdown);
}
