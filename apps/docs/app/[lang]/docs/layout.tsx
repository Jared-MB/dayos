import { Sidebar } from "../../_components/sidebar";
import { TableOfContents } from "../../_components/toc";

/**
 * Three columns: the docs' contents, the page, and the page's contents. The
 * outer two are sticky and scroll on their own; the middle one is the document.
 */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="docs-shell">
      <Sidebar />
      <main className="docs-main">{children}</main>
      <TableOfContents />
    </div>
  );
}
