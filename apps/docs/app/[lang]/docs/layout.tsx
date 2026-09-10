import { Sidebar } from "../../_components/sidebar";
import { TableOfContents } from "../../_components/toc";
import { sections } from "../../_lib/docs";
import { toLocale } from "../../_lib/i18n";

/**
 * Three columns: the docs' contents, the page, and the page's contents. The
 * outer two are sticky and scroll on their own; the middle one is the document.
 *
 * The sidebar's list is read here rather than in the sidebar: its titles come
 * from the top of each page's `.mdx`, and reading files is the server's job.
 */
export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = toLocale((await params).lang);

  return (
    <div className="docs-shell">
      <Sidebar sections={sections(lang)} />
      <main className="docs-main">{children}</main>
      <TableOfContents />
    </div>
  );
}
