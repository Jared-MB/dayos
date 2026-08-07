import Link from "next/link";
import { DOCUMENTS, documentHref } from "./documents";

export default function DocumentsPage() {
  return (
    <article className="prose">
      <h1>Documents</h1>
      <p>
        Each of these is its own route, and opening one leaves this window
        alone: the list stays on this page while the document gets a window of
        its own next to it.
      </p>
      <ul className="document-list">
        {DOCUMENTS.map(({ file, name }) => (
          <li key={file}>
            <Link href={documentHref(file)}>{name}</Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
