import type { MDXContent } from "mdx/types";
import { DocPage, docMetadata } from "../../../_components/doc-page";
import { type Locale, toLocale } from "../../../_lib/i18n";
import En from "./en.mdx";
import Es from "./es.mdx";

/**
 * /docs/routing
 *
 * The page is the two files next to this one: each opens with its own title
 * and description, and carries the prose under them. All this route adds is
 * which of the two the reader asked for. Where the page sits among the others
 * — its section, and the pages either side of it — is `app/_lib/nav.ts`.
 */
const HREF = "/docs/routing";

const CONTENT: Record<Locale, MDXContent> = { en: En, es: Es };

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params) {
  return docMetadata(toLocale((await params).lang), HREF);
}

export default async function Page({ params }: Params) {
  const lang = toLocale((await params).lang);
  const Content = CONTENT[lang];

  return (
    <DocPage href={HREF} lang={lang}>
      <Content />
    </DocPage>
  );
}
