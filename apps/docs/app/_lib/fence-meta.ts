/**
 * The words after the language on a fence.
 *
 *     ```tsx title="app/page.tsx" added="3,4" removed="1"
 *
 * Read here rather than in the component that renders a block, because the
 * Markdown twin reads the same line straight out of the `.mdx` file and has to
 * understand it the same way.
 */

export type FenceMeta = {
  filename?: string;
  added?: readonly number[];
  removed?: readonly number[];
};

/** `"3,4"` and `"1-3"` and `"1-3,7"` all mean the lines they look like. */
const lines = (value: string | undefined): number[] | undefined => {
  if (!value) return undefined;

  const out = value.split(",").flatMap((part) => {
    const [from, to] = part.trim().split("-").map(Number);

    if (from === undefined || !Number.isFinite(from)) return [];
    if (to === undefined || !Number.isFinite(to)) return [from];

    return Array.from({ length: to - from + 1 }, (_, step) => from + step);
  });

  return out.length > 0 ? out : undefined;
};

const attribute = (meta: string, name: string) =>
  meta.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

export function parseFenceMeta(meta: string | undefined): FenceMeta {
  if (!meta) return {};

  return {
    filename: attribute(meta, "title"),
    added: lines(attribute(meta, "added")),
    removed: lines(attribute(meta, "removed")),
  };
}
