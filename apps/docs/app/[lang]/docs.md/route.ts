import { pageMarkdown } from "../../_lib/doc-source";
import { LOCALES, toLocale } from "../../_lib/i18n";
import { markdownResponse } from "../../_lib/markdown-response";

// The content is fixed at build time, so this is a file and not a request.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * The docs index, as Markdown. It sits here rather than under the catch-all
 * next door because `/docs.md` is not a path below `/docs` — the one page whose
 * twin is a sibling instead of a child.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  const markdown = pageMarkdown(toLocale(lang), "/docs");

  if (!markdown) return new Response("Not found", { status: 404 });

  return markdownResponse(markdown);
}
