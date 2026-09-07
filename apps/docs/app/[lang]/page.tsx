import { toLocale } from "../_lib/i18n";
import En from "./_home/en";
import Es from "./_home/es";

/**
 * The landing page. Its two versions sit in `_home` beside this file; the
 * route's job is to pick the reader's language and render it.
 */
const CONTENT = { en: En, es: Es };

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const Content = CONTENT[toLocale((await params).lang)];

  return <Content />;
}
