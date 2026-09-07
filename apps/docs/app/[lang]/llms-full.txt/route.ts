import { llmsFullTxt } from "../../_lib/doc-source";
import { LOCALES, toLocale } from "../../_lib/i18n";
import { markdownResponse } from "../../_lib/markdown-response";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * The whole documentation as one file, for a reader that would rather paste
 * everything once than follow fourteen links.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;

  return markdownResponse(llmsFullTxt(toLocale(lang)));
}
