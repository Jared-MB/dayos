import Image from "next/image";
import { notFound } from "next/navigation";
import { DOCUMENTS, findDocument } from "../documents";

export function generateStaticParams() {
  return DOCUMENTS.map(({ file }) => ({ file }));
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ file: string }>;
}) {
  const { file } = await params;
  const document = findDocument(file);

  // The param decides which window opens, so it can't be trusted to be one of
  // ours: anything else is a 404 and not an empty window.
  if (!document) notFound();

  return (
    // The dimensions are declared alongside the file: it's served from
    // `public`, so there's no static import for `next/image` to read them from.
    <Image
      alt={document.name}
      className="document"
      height={document.height}
      src={`/${document.file}`}
      width={document.width}
    />
  );
}
