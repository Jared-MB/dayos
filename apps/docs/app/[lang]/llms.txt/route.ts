import { llmsTxt } from "../../_lib/doc-source";
import { LOCALES, toLocale } from "../../_lib/i18n";
import { markdownResponse } from "../../_lib/markdown-response";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** The map of the docs, at the address the convention puts it. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

  return markdownResponse(llmsTxt(toLocale(lang)));
}
