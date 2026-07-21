/**
 * The demo's documents. They live in one place because three sides need them:
 * the list page renders the links, the dynamic route validates its param
 * against them, and the shell reads the name for the window's title bar.
 */
export const DOCUMENTS = [
  { file: "sheets.avif", name: "Sheets", width: 750, height: 1000 },
  { file: "violin.avif", name: "Violin", width: 750, height: 1000 },
] as const;

export const documentHref = (file: string) => `/documents/${file}`;

export const findDocument = (file: string | undefined) =>
  DOCUMENTS.find((document) => document.file === file);
