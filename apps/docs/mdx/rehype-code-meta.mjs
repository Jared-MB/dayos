/**
 * The words after the language on a fence, handed to the component that
 * renders it.
 *
 *     ```tsx title="app/page.tsx" added="3,4"
 *
 * Markdown calls that the "meta" string and carries it as far as `code.data`,
 * where nothing downstream looks: MDX builds its JSX from `properties`, so a
 * fence's filename would be dropped on the floor between the parser and the
 * page. This moves it across, along with the language that until now was only
 * legible as a `language-tsx` class.
 *
 * Both land on the `<pre>` rather than the `<code>` inside it, because `pre` is
 * what `mdx-components.tsx` swaps for a `CodeBlock` — the `code` element is by
 * then an implementation detail of the block, not something with props of
 * its own.
 */
export default function rehypeCodeMeta() {
  return (tree) =>
    visit(tree, (node) => {
      if (node.tagName !== "pre") return;

      const code = node.children?.find((child) => child.tagName === "code");
      if (!code) return;

      const classes = code.properties?.className ?? [];
      const language = classes
        .find((name) => String(name).startsWith("language-"))
        ?.slice("language-".length);

      node.properties = {
        ...node.properties,
        ...(language ? { "data-language": language } : null),
        ...(code.data?.meta ? { "data-meta": code.data.meta } : null),
      };
    });
}

function visit(node, run) {
  if (!node || typeof node !== "object") return;

  run(node);

  for (const child of node.children ?? []) visit(child, run);
}
