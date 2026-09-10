import type { MDXContent } from "mdx/types";
import { DocPage, docMetadata } from "../../../_components/doc-page";
import { type Locale, toLocale } from "../../../_lib/i18n";
import En from "./en.mdx";
import Es from "./es.mdx";

const HREF = "/docs/examples";

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
